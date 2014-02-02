var TemplateFeature = require('./index.js');


/*
 *  Style Feature
 *  @name    TemplateFeatureStyle
 *  @package Scaffold
 */
function TemplateFeatureStyle(element, template)
{
	var style = this

	TemplateFeature.apply(style, arguments);


	/**
	 *  Create a new DOMelement with given name, attributes and/or content
	 *  @name    createNode
	 *  @type    function
	 *  @access  internal
	 *  @param   string nodeName
	 *  @param   object attributes [optional, default null - no attributes]
	 *  @param   string content [optional, default null - no content]
	 */
	function createNode(name, attr, content)
	{
		var dom = style.dom(),
			node = element.parentNode.insertBefore(
				dom.createElement(name),
				element
			),
			p;

		if (attr)
			for (p in attr)
				node.setAttribute(p, attr[p]);

		if (content)
			node.appendChild(dom.createCDATASection(content));
	}

	/**
	 *  Obtain a list of required stylesheets and create a <link> element for linked stylesheets or a <style> element
	 *  for embedded stylesheets
	 *  @name    render
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	style.render = function(done)
	{
		var list = template.features('require', {type: 'text/css'}, true),
			files = {};

		list.forEach(function(feature){
			var file = feature.attribute('file'),
				value;

			if (file)
			{
				if (!(file in files) || feature.attribute('multiple') === 'true')
					files[file] = true;
				else
					return;

				createNode('link', {
					type: 'text/css',
					rel:  'stylesheet',
					href:  file
				});
			}
			else
			{
				value = feature.value();
				if (value !== '')
				{
					createNode('style', {
						type: 'text/css',
					}, value);
				}
			}
		});
	};
}


module.exports = TemplateFeatureStyle;
