var TemplateFeature = require('./index.js');


function TemplateFeatureStyle(element, template)
{
	var style = this

	TemplateFeature.apply(style, arguments);


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
