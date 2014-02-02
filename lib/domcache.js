var fs = require('fs');


/*
 *  Caching of files and handling asynchronous callbacks
 *  @name    DOMCache
 *  @package Scaffold
 */
function DOMCache()
{
	//  if an __instance property is found, the object is already constructed and should be returned
	if (DOMCache.prototype.__instance)
		return DOMCache.prototype.__instance;
	//  make a reference to 'this' and set it to be the __instance returned as singleton
	DOMCache.prototype.__instance = this;

	var cache = this,
		buffer = {};


	/*
	 *  load a file asynchronously and ensure the callback
	 *  (callbacks are executed immediately if the resource is already available)
	 *  @name   load
	 *  @type   function
	 *  @access internal
	 *  @param  string   filename (or source)
	 *  @param  function callback
	 *  @return void
	 */
	function load(name, done)
	{
		//  check whether the requested <name> already is available
		if (name in buffer)
		{
			//  if the document is available, we trigger the callback
			//  if the document is not yet available the document is being fetched, we add the callback to the stack
			if (buffer[name].document)
				done(null, buffer[name].document);
			else
				buffer[name].callback.push(done);

			return;
		}

		//  the resource is unknown, hence we prepare the buffer item
		buffer[name] = {
			document: false,
			callback: [done]
		};

		//  does the resource look like a file (basically: a lot of characters optionally including slashes followed by
		//  something that looks file a file extension ending with 'ml', e.g. '.html', '.xml')
		//  if so, load it asynchronously, otherwise we assume it to be raw XML
		if (/^[a-zA-Z0-9_\.\/-]+\.[a-zA-Z]+ml$/.test(name))
		{
			//  any error locating the resource will end up providing the name as source
			fs.readFile(name, function(error, data){
				var document = error ? name : data.toString(),
					ready;

				buffer[name].document = document;
				dispatch(name);
			});
		}
		else
		{
			buffer[name].document = name;
			dispatch(name);
		}
	}

	/*
	 *  Dispatch registered callbacks for given file or source
	 *  @name   dispatch
	 *  @type   function
	 *  @access internal
	 *  @param  string filename (or source)
	 *  @return void
	 */
	function dispatch(name)
	{
		while (buffer[name].callback.length)
		{
			ready = buffer[name].callback.shift();
			ready(null, buffer[name].document);
		}
	}

	/*
	 *  load a file asynchronously and ensure the callback
	 *  (callbacks are executed immediately if the resource is already available)
	 *  @name   load
	 *  @type   method
	 *  @access public
	 *  @param  string   filename (or source)
	 *  @param  function callback
	 *  @return void
	 */
	cache.load = load;
}


module.exports = DOMCache;
