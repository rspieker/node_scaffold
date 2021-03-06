var TemplateFeature = require('./index.js'),
	XML = require('xmldom'),
	fs = require('fs');


/*
 *  Embed external templates
 *  @name    TemplateFeatureInclude
 *  @package Scaffold
 */
function TemplateFeatureInclude(element, template)
{
	var include = this;

	TemplateFeature.apply(include, arguments);


	/**
	 *  Replace the feature node with the contents of included file
	 *  @name    prepare
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	include.prepare = function(done)
	{
		var file = include.attribute('file');

		include.clean();
		if (file)
		{
			fs.readFile(file, function(error, data){
				var dom;

				if (!error && data)
				{
					dom = new XML.DOMParser().parseFromString('<include>' + data + '</include>');
					while (dom.documentElement.firstChild)
					{
						element.parentNode.insertBefore(element.ownerDocument.importNode(dom.documentElement.firstChild, true), element);
						dom.documentElement.removeChild(dom.documentElement.firstChild);
					}
				}

				if (done)
					done(error, include);
			});
			return;
		}

		done(new Error('no template file provided for k:include feature'));
	};
}

module.exports = TemplateFeatureInclude;
