var TemplateFeature = require('./index.js');


/*
 *  Script Feature
 *  @name    TemplateFeatureScript
 *  @package Scaffold
 */
function TemplateFeatureScript(element, template)
{
	var script = this

	TemplateFeature.apply(script, arguments);


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
		var dom = script.dom(),
			node = element.parentNode.insertBefore(
				dom.createElement(name),
				element
			),
			p;

		if (attr)
			for (p in attr)
				node.setAttribute(p, attr[p]);

		node.appendChild(dom.createTextNode(content));
	}

	/**
	 *  Obtain a list of required javascripts and create a <script> element for each one
	 *  @name    render
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	script.render = function(done)
	{
		var list = template.features('require', {type: 'application/javascript'}, true),
			files = {},
			dom = script.dom(),
			node;

		list.forEach(function(feature){
			var file = feature.attribute('file'),
				value;

			if (file)
			{
				if (!(file in files) || feature.attribute('multiple') === 'true')
					files[file] = true;
				else
					return;
			}

			//  assume a file for now..
			if (file)
			{
				createNode('script', {type: 'text/javascript', src: file}, '');
			}
			else
			{
				value = feature.value();

				if (value !== '')
					createNode('script', {type: 'text/javascript'}, value);
			}
		});
	};
}


module.exports = TemplateFeatureScript;
