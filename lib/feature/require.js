var Template = require('../index.js'),
	TemplateFeature = require('./index.js'),
	MIME = require('mime');


/*
 *  Handle requirements
 *  @name    TemplateFeatureRequire
 *  @package Scaffold
 */
function TemplateFeatureRequire(element, template)
{
	var require = this;

	TemplateFeature.apply(require, arguments);


	/**
	 *  If no type was provided, read it from the required file and set it as attribute (so it can be filtered later on)
	 *  @name    prepare
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	require.prepare = function(done)
	{
		if (require.attribute('file') && !require.attribute('type'))
			require.attribute('type', MIME.lookup(require.attribute('file')));

		if (done)
			done(null, require);
	};
}


module.exports = TemplateFeatureRequire;
