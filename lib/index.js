var XPath = require('xpath'),
	XML = require('xmldom'),
	async = require('async'),
	DOMCache = require('./domcache.js'),
	Feature = require('./feature.js');


/*
 *  Template module
 *  @name    Template
 *  @package Scaffold
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


	/**
	 *  Initializer function, taking care of the bootstrapping of Template instances
	 *  @name    init
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
	function init()
	{
		if (parent instanceof Template)
			parent.child(template);

		return cache.load(source, function(error, document){
			var list;

			//  create the internal DOMDocument
			dom  = new XML.DOMParser().parseFromString(wrapSource(document));
			list = extractFeatures().map(function(item){
				return item.instance.prepare;
			});

			//  call each extracted feature in series and finally call the done method provided with
			//  the Template construction
			async.series(list, function(error, result){
				if (done)
					done(null, template);
			});
		});
	}

	/**
	 *  Wrap the given source string in a custom XML-element, ensuring the proper addition of the XML-namespace and
	 *  allowing for XML source which would contain multiple documentElements
	 *  @name    wrapSource
	 *  @type    function
	 *  @access  internal
	 *  @param   string source
	 *  @return  string wrapped source
	 */
	function wrapSource(source)
	{
		var match = source.match(/^\s*<!DOCTYPE[^>]*>/i),
			docType = match && match[0] ? match[0] : false;

		if (docType)
			source = source.replace(docType, '');

		return (docType || '') + '<TemplateWrapper xmlns:k="/">' + source.replace(/\s+/g, ' ') + '</TemplateWrapper>';
	}

	/**
	 *  Apply a callback method to each element found with given query
	 *  @name    xpath
	 *  @type    function
	 *  @access  internal
	 *  @param   string query
	 *  @param   function callback
	 *  @return  void
	 */
	function xpath(query, callback)
	{
		if (query !== '' && dom)
			XPath.select(query, dom).forEach(callback);
	}

	/**
	 *  Extract all features from the template
	 *  @name    extractFeatures
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMDocument xml [optional, default null - using the internal DOM]
	 *  @return  Array features
	 */
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

		return feature;
	}

	/**
	 *  Apply a callback on every feature matching the type and/or filter
	 *  @name    featureExec
	 *  @type    function
	 *  @access  internal
	 *  @param   function callback
	 *  @param   string feature type [optional, default null - all features]
	 *  @param   object filter [optional - default null, no filter]
	 *  @return  void
	 */
	function featureExec(callback, type, filter)
	{
		var list = getFeatures(type || false, filter),
			p;

		list.forEach(callback);
	}

	/**
	 *  Filter all available features
	 *  @name    getFeatures
	 *  @type    function
	 *  @access  internal
	 *  @param   string feature type
	 *  @param   object filters [optional, default null - no filtering]
	 *  @param   bool   children [optional, default null - do not traverse child templates]
	 *  @return  Array features
	 */
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

	/**
	 *  Clean up the internal template (remove feature nodes, comments, excess whitespace and empty attributes)
	 *  @name    clean
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
	function clean()
	{
		featureExec(function(f){
			f.clean();
		});
		dom.normalize();

		xpath('//comment()', function(node){
			node.parentNode.removeChild(node);
		});

		xpath('//html//text()[not(ancestor::body) and not(ancestor::script)]', function(node){
			var value = node.nodeValue.trim();

			if (value !== '')
				node.parentNode.insertBefore(dom.createTextNode(value), node);
			node.parentNode.removeChild(node);
		});

		xpath('//body//text()[not(ancestor::script)]', function(node){
			var value = node.nodeValue.replace(/\s+/g, ' ');

			if (!/^\s+$/.test(value))
				node.parentNode.insertBefore(dom.createTextNode(value), node);
			node.parentNode.removeChild(node);
		});

		xpath('//@*[.=""]', function(node){
			node.ownerElement.removeAttribute(node.name);
		});
	}


	/**
	 *  Render the template
	 *  @name    render
	 *  @type    function
	 *  @access  internal
	 *  @param   bool as DOM [optional, default null - as string]
	 *  @return  mixed template [one of: string output or DOMDocument output]
	 */
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

	/**
	 *  Replace the placeholders with their associated values
	 *  @name    replace
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
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

	/**
	 *  Resolve the value for a placeholder, if a value is assigned use it directly (or call the given callback) or
	 *  use the given default value (defined in the template as {placeholder:default value})
	 *  @name    resolve
	 *  @type    function
	 *  @access  internal
	 *  @param   string key
	 *  @param   string value [optional, default null - an empty value]
	 *  @return  string result
	 *  @note    the callback functions are invoked with the following arguments: key, value
	 */
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
				result = result instanceof Template ? result.render(true) : '(' + (typeof result) + ')' + result;
				break;
		}

		return result;
	}

	/**
	 *  Replace the placeholder DOMText element with a new DOMText element with the resolved value
	 *  @name    placeholder
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMText element
	 *  @return  void
	 */
	function placeholder(node)
	{
		var pattern = /^\{([^:\}]+)(?::([^\}]+))?\}$/,
			match = node.nodeValue.match(pattern),
			replacement = resolve(match[1], match[2]),
			i;

		if ('object' === typeof replacement && 'nodeType' in replacement)
		{
			for (i = 0; i < replacement.childNodes.length; ++i)
			{
				console.log(replacement.childNodes[i].nodeType, replacement.childNodes[i].nodeValue);
				node.parentNode.insertBefore(
					replacement.childNodes[i],
					node
				);
			}
			node.parentNode.removeChild(node);
		}
		else
		{
			node.parentNode.replaceChild(dom.createTextNode(replacement), node);
		}
	}

	/**
	 *  Post-process the rendered string output, effectively removing the self-closing of self-closing elements in the
	 *  source (e.g. <br /> becomes <br>)
	 *  @name    postProcess
	 *  @type    function
	 *  @access  internal
	 *  @param   string source
	 *  @return  string processed source
	 */
	function postProcess(output)
	{
		output = output.replace(/\/>/g, '>');

		return output;
	}

	/**
	 *  Associated a replacement value for placeholder with match key
	 *  @name    assign
	 *  @type    function
	 *  @access  internal
	 *  @param   string key
	 *  @param   mixed  value [either a scalar value or a callback function which provides the value)
	 *  @return  void
	 *  @see     resolve
	 */
	function assign(key, value)
	{
		variable[key] = value;
	}



	/**
	 *  Let the Template know it has child-templates (used to search for features)
	 *  @name    child
	 *  @type    method
	 *  @access  public
	 *  @param   Template child
	 *  @return  void
	 */
	template.child = function(template)
	{
		if (template instanceof Template)
			child.push(template);
	};

	/**
	 *  Assign placeholder replacement values
	 *  @name    assign
	 *  @type    method
	 *  @access  public
	 *  @param   mixed key (one of: string key, function default callback or object key/value)
	 *  @param   mixed value (one of: scalar value, function callback for the given value)
	 *  @return  void
	 */
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

	/**
	 *  Filter all available features
	 *  @name    features
	 *  @type    method
	 *  @access  public
	 *  @param   string feature type
	 *  @param   object filters [optional, default null - no filtering]
	 *  @param   bool   children [optional, default null - do not traverse child templates]
	 *  @return  Array features
	 *  @alias   getFeatures
	 */
	template.features = getFeatures;

	/**
	 *  Add a block of given name and return the associated template
	 *  @name    block
	 *  @type    method
	 *  @access  public
	 *  @param   string  block name
	 *  @return  Template block (null if the block feature was not found)
	 */
	template.block = function(name)
	{
		var instance = getFeatures('block', {name: name});

		return instance && instance.length ? instance[0].duplicate() : null;
	};

	/**
	 *  Render the template
	 *  @name    render
	 *  @type    method
	 *  @access  public
	 *  @param   bool as DOM [optional, default null - as string]
	 *  @return  mixed template [one of: string output or DOMDocument output]
	 */
	template.render = function(asDOM)
	{
		return render(asDOM);
	};

	init();
}


module.exports = function(source, done, parent){
	return new Template(source, done, parent);
};
