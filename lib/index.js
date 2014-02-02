var XPath = require('xpath'),
	XML = require('xmldom'),
	async = require('async'),
	DOMCache = require('./domcache.js'),
	Feature = require('./feature.js');


/*
 *  Template module
 *  @name    Template
 *  @package Template
 */
function Template(source, done, parent)
{
	var template = this,
		cache = new DOMCache(),
		featureHandle = new Feature(),
		feature = [],
		variable = {},
		child = [],
		dom;


	function init()
	{
		if (parent instanceof Template)
			parent.child(template);

		return cache.load(source, function(error, document){
			dom = new XML.DOMParser().parseFromString(wrapSource(document));

			async.series(extractFeatures(), function(error, result){
				if (done)
					done(null, template);
			});
		});
	}

	function wrapSource(source)
	{
		var match = source.match(/^\s*<!DOCTYPE[^>]*>/i),
			docType = match && match[0] ? match[0] : false;

		if (docType)
			source = source.replace(docType, '');

		return (docType || '') + '<TemplateWrapper xmlns:k="/">' + source.replace(/\s+/g, ' ') + '</TemplateWrapper>';
	}

	function xpath(path, callback)
	{
		if (path !== '' && dom)
			XPath.select(path, dom).forEach(callback);
	}

	function extractFeatures(xml)
	{
		var list = XPath.select('//*[starts-with(name(), "k:") and not(ancestor::*[starts-with(name(), "k:")])]', xml || dom),
			name, handle, instance, i;

		for (i = 0; i < list.length; ++i)
		{
			name   = list[i].localName.toLowerCase();

			feature.push({
				name: name,
				instance: featureHandle.instance(name, list[i], template),
				prepared: false
			});
		}

		return feature.map(function(item){
			return item.instance.prepare;
		});
	}

	function featureExec(callback, type, filter)
	{
		var list = getFeatures(type || false, filter),
			p;

		list.forEach(callback);
	}

	function getFeatures(type, filter, children)
	{
		var list = feature.filter(function(item){
				var p;

				if (type !== false && item.name !== type)
					return false;

				if ('object' === typeof filter)
					for (p in filter)
						if (filter[p] !== item.instance.attribute(p))
							return false;

				return true;
			}).map(function(item){
				return item.instance;
			});

		if (children)
			child.forEach(function(t){
				list = list.concat(t.features(type, filter, children));
			});

		return list;
	}

	function clean()
	{
		featureExec(function(f){
			f.clean();
		});
		dom.normalize();

		xpath('//comment()', function(node){
			node.parentNode.removeChild(node);
		});

		xpath('//text()[not(ancestor::body) and not(ancestor::script)]', function(node){
			var value = node.nodeValue.trim();

			if (value !== '')
				node.parentNode.insertBefore(dom.createTextNode(value), node);
			node.parentNode.removeChild(node);
		});

		xpath('//text()[ancestor::body and not(ancestor::script)]', function(node){
			var value = node.nodeValue.replace(/\s+/g, ' ');

			if (!/^\s+$/.test(value))
				node.parentNode.insertBefore(dom.createTextNode(value), node);
			node.parentNode.removeChild(node);
		});

		xpath('//@*[.=""]', function(node){
			node.ownerElement.removeAttribute(node.name);
		});
	}


	function render(asDOM)
	{
		var document;

		replace();
		featureExec(function(f){
			f.render();
		});
		clean();

		if (dom.documentElement)
		{
			document = dom.removeChild(dom.documentElement);
			while (document.firstChild)
				dom.appendChild(document.firstChild);
		}

		return asDOM ? dom : postProcess(new XML.XMLSerializer().serializeToString(dom));
	}

	function replace()
	{
		xpath('//text()[not(ancestor::script) and contains(.,"{") and contains(.,"}")]', function(node){

			var start = node.nodeValue.indexOf('{'),
				replace;

			while (start >= 0)
			{
				replace = node.splitText(start);
				node = replace.splitText(replace.nodeValue.indexOf('}') + 1);
				placeholder(replace);
				start = node.nodeValue.indexOf('{');
			}

		});

		xpath('//@*[not(ancestor::script) and contains(.,"{") and contains(.,"}")]', function(node){

			var pattern = /\{([^:\}]+)(?::([^\}]+))?\}/g,
				value = node.nodeValue,
				match;

			while ((match = pattern.exec(node.nodeValue)) !== null)
				value = value.replace(match[0], resolve(match[1], match[2]));

			node.ownerElement.setAttribute(node.nodeName, value.trim());

		});
	}

	function resolve(key, value)
	{
		var result = key in variable ? variable[key] : undefined;

		switch (typeof result)
		{
			case 'function':
				result = result(key, value);
				break;

			case 'string':
			case 'number':
				break;

			case 'undefined':
				result = '@default' in variable ? variable['@default'](key, value) : (value || '');
				break;

			default:
				result = result instanceof Template ? result.render() : '(' + (typeof result) + ')' + result;
				break;
		}

		return result;
	}

	function placeholder(node)
	{
		var replacement = node.nodeValue.replace(/^\{([^:\}]+)(?::([^\}]+))?\}$/, function(match, name, value){
				return resolve(name, value);
			});

		node.parentNode.replaceChild(dom.createTextNode(replacement), node);
	}

	function postProcess(output)
	{
		output = output.replace(/\/>/g, '>');

		return output;
	}

	function assign(key, value)
	{
		variable[key] = value;
	}


	template.child = function(template)
	{
		child.push(template);
	};

	template.assign = function(key, value)
	{
		switch (typeof key)
		{
			case 'function':
				assign('@default', key);
				//  maybe perhaps a default function called for any (unknown?) value?
				break;

			case 'object':
				Object.keys(key).forEach(function(name){
					template.assign(name, key[name]);
				});
				break;

			case 'string':
				if (/^[a-z_][a-z0-9_]*$/i.test(key))
					assign(key, value);
				else
					console.log('not a valid key', key);
				break;
		}
	};

	template.features = getFeatures;

	template.block = function(name)
	{
		var instance = getFeatures('block', {name: name});

		return instance && instance.length ? instance[0].duplicate() : null;
	};

	template.render = function(asDOM)
	{
		return render(asDOM);
	};

	init();
}


module.exports = function(source, done, parent){
	return new Template(source, done, parent);
};
