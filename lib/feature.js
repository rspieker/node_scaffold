/*
 *  Manage template features
 *  @name    Feature
 *  @package Template
 */
function Feature()
{
	//  if an __instance property is found, the object is already constructed and should be returned
	if (Feature.prototype.__instance)
		return Feature.prototype.__instance;
	//  make a reference to 'this' and set it to be the __instance returned as singleton
	Feature.prototype.__instance = this;

	var feature = this,
		buffer = {
			'@default': require('./feature/index.js'),
			include: require('./feature/include.js'),
			block: require('./feature/block.js'),
			require: require('./feature/require.js'),
			script: require('./feature/script.js'),
			style: require('./feature/style.js')
		};

	function lookup(name)
	{
		return name in buffer ? buffer[name] : buffer['@default'];
	}

	function register(name, constructor)
	{
		buffer[name] = constructor;
	}

	feature.instance = function(name, node, template)
	{
		var handle = lookup(name);
		return new handle(node, template);
	};

	feature.learn = function(name, constructor)
	{
		var p;

		if ('object' === typeof name)
		{
			for (p in name)
				register(p, name[p]);
			return true;
		}

		if (constructor)
			register(name, constructor);

		return lookup(name);
	};
}


module.exports = Feature;
