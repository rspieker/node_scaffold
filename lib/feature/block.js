var Template = require('../index.js'),
	TemplateFeature = require('./index.js'),
	XML = require('xmldom');


/*
 *  Handle optional and/or repeating blocks
 *  @name    TemplateFeatureRequire
 *  @package Scaffold
 */
function TemplateFeatureBlock(element, template)
{
	var block = this,
		stack = [],
		marker, data;

	TemplateFeature.apply(block, arguments);


	/**
	 *  Obtain the contents of the block element and prepare it for use in new Template instances
	 *  @name    contents
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement node
	 *  @return  string content
	 */
	function contents(node)
	{
		var result = '',
			serializer = new XML.XMLSerializer(),
			i;

		for (i = 0; i < node.childNodes.length; ++i)
			result += serializer.serializeToString(node.childNodes[i]);

		return result;
	}

	/**
	 *  Duplicate the block, creating a new template to render before the marker element
	 *  @name    duplicate
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
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

	/**
	 *  Extract the blocks template data and create a marker before which new blocks are added
	 *  @name    prepare
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
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

	/**
	 *  Render all blocks added to the stack
	 *  @name    render
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
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
