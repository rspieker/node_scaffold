var Template = require('../index.js'),
	TemplateFeature = require('./index.js'),
	XML = require('xmldom');


function TemplateFeatureBlock(element, template)
{
	var block = this,
		stack = [],
		marker, data;

	TemplateFeature.apply(block, arguments);


	function contents(node)
	{
		var result = '',
			serializer = new XML.XMLSerializer(),
			i;

		for (i = 0; i < node.childNodes.length; ++i)
			result += serializer.serializeToString(node.childNodes[i]);

		return result;
	}

	block.duplicate = function(done)
	{
		var instance = new Template(data, done, template);

		instance.assign({
			_position: stack.length,
			_parity: stack.length % 2 === 0 ? 'even' : 'odd',
			_name: block.attribute('name')
		});

		stack.push(instance);
		return instance;
	};

	block.prepare = function(done)
	{
		data   = contents(element);
		marker = element.parentNode.insertBefore(
			element.ownerDocument.createComment('block \'' + block.attribute('name') + '\''),
			element
		);

		element.parentNode.removeChild(element);

		if (done)
			done(null, block);
	};

	block.render = function(done)
	{
		stack.forEach(function(template){
			var render = template.render(true),
				i;

			marker.parentNode.insertBefore(
				render,
				marker
			);
		});
		marker.parentNode.removeChild(marker);
	};
}


module.exports = TemplateFeatureBlock;
