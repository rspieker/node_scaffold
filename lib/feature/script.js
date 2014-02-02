var TemplateFeature = require('./index.js');


function TemplateFeatureScript(element, template)
{
	var script = this

	TemplateFeature.apply(script, arguments);

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
