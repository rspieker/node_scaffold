var Template = require('../index.js'),
	TemplateFeature = require('./index.js'),
	MIME = require('mime');


function TemplateFeatureRequire(element, template)
{
	var require = this;

	TemplateFeature.apply(require, arguments);


	require.prepare = function(done)
	{
		if (require.attribute('file') && !require.attribute('type'))
			require.attribute('type', MIME.lookup(require.attribute('file')));

		if (done)
			done(null, require);
	};
}


module.exports = TemplateFeatureRequire;
