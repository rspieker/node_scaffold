/*
 *  Manage template features
 *  @name    Feature
 *  @package Scaffold
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


	/**
	 *  Look up given feature name and return the best matching hit
	 *  (One of: exact defined feature or the default)
	 *  @name    lookup
	 *  @type    function
	 *  @access  internal
	 *  @param   string name
	 *  @return  function constructor
	 */
	function lookup(name)
	{
		return name in buffer ? buffer[name] : buffer['@default'];
	}

	/**
	 *  Register a feature to return for given name
	 *  @name    register
	 *  @type    function
	 *  @access  internal
	 *  @param   string name
	 *  @param   function constructor
	 *  @return  void
	 */
	function register(name, constructor)
	{
		buffer[name] = constructor;
	}



	/**
	 *  Obtain a new instance of given feature, initialized with the node and template
	 *  @name    instance
	 *  @type    method
	 *  @access  public
	 *  @param   string feature name
	 *  @param   DOMNode node
	 *  @param   Template template
	 *  @return  TemplateFeature instance
	 */
	feature.instance = function(name, node, template)
	{
		var handle = lookup(name);
		return new handle(node, template);
	};

	/**
	 *  Create a new feature associtation
	 *  @name    instance
	 *  @type    method
	 *  @access  public
	 *  @param   mixed feature (one of: string feature name or object name:constructor pairs)
	 *  @param   function constructor [optional, default null - see note]
	 *  @return  mixed result (see note)
	 *  @note    if name is a string feature name, the return value is always the associated feature,
	 *           which was also set if the optional constructor function was provided.
	 *           if name is an object, the each key/value pair in the object is registered as name/constructor,
	 *           in this case the return value is (bool) true
	 */
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
