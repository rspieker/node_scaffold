var TemplateFeature = require('./index.js'),
	XML = require('xmldom'),
	fs = require('fs');


function TemplateFeatureInclude(element, template)
{
	var include = this;

	TemplateFeature.apply(include, arguments);


	include.prepare = function(done)
	{
		var file = include.attribute('file'),
			dom;

		if (file)
		{
			file = fs.readFileSync(file);
			dom  = new XML.DOMParser().parseFromString('<include>' + file.toString() + '</include>');
			while (dom.documentElement.firstChild)
			{
				element.parentNode.insertBefore(element.ownerDocument.importNode(dom.documentElement.firstChild, true), element);
				dom.documentElement.removeChild(dom.documentElement.firstChild);
			}
		}

		if (done)
			done(null, include);
	};
}

module.exports = TemplateFeatureInclude;
