/*
 *  Default Template feature
 *  @name    Feature
 *  @package Scaffold
 */
function TemplateFeature(element, template)
{
	var feature = this,
		value;


	/**
	 *  Initializer function, bootstrapping the feature
	 *  @name    init
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
	function init()
	{
		var i;

		value = '';
		for (i = 0; i < element.childNodes.length; ++i)
			value += element.childNodes[i].nodeValue;
	}



	/**
	 *  Access attributes of the associated DOMElement
	 *  @name    attribute
	 *  @type    method
	 *  @access  public
	 *  @param   string name [optional, default null - return all attributes in an object]
	 *  @param   string value [optional, default null - do not set the attribute value]
	 *  @return  mixed  value (one of: object containing all attributes, the value for the given name)
	 */
	feature.attribute = function(name, value)
	{
		var all, i;

		if (name && value)
			element.setAttribute(name, value);
		if (name)
			return element.getAttribute(name);

		all = {};

		for (i = 0; i < element.attributes.length; ++i)
			all[element.attributes[i].nodeName] = element.attributes[i].nodeValue;

		return all;
	};

	/**
	 *  Obtain the original value of the DOMElement associated with the feature
	 *  @name    value
	 *  @type    method
	 *  @access  public
	 *  @return  string value
	 */
	feature.value = function()
	{
		return value || '';
	};

	/**
	 *  Obtain the DOMElement associated with the feature
	 *  @name    node
	 *  @type    method
	 *  @access  public
	 *  @return  DOMElement element
	 */
	feature.node = function()
	{
		return element;
	};

	/**
	 *  Obtain the DOMDocument in which the DOMElement resides
	 *  @name    dom
	 *  @type    method
	 *  @access  public
	 *  @return  DOMDocument document
	 */
	feature.dom = function()
	{
		return element.ownerDocument;
	};

	/**
	 *  Remove the feature node from the document
	 *  @name    clean
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 *  @note    this method is automatically called by the Template instance that constructed the feature
	 */
	feature.clean = function(done)
	{
		if (element.parentNode)
			element.parentNode.removeChild(element);

		if (done)
			done(null, feature);
	};

	/**
	 *  Prepare the feature
	 *  @name    prepare
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 *  @note    this method is automatically called by the Template instance that constructed the feature
	 */
	feature.prepare = function(done)
	{
		if (done)
			done(null, feature);
	};

	/**
	 *  The feature should be rendered as the template is rendering itself
	 *  @name    render
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 *  @note    this method is automatically called by the Template instance that constructed the feature
	 */
	feature.render = function(done)
	{
		if (done)
			done(null, feature);
	};

	init();
}


module.exports = TemplateFeature;
