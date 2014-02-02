function TemplateFeature(element, template)
{
	var feature = this,
		value;


	function init()
	{
		var i;

		value = '';
		for (i = 0; i < element.childNodes.length; ++i)
			value += element.childNodes[i].nodeValue;
	}

	feature.attribute = function(name, value)
	{
		var all, i;

		if (value)
			element.setAttribute(name, value);
		if (name)
			return element.getAttribute(name);

		all = {};

		for (i = 0; i < element.attributes.length; ++i)
			all[element.attributes[i].nodeName] = element.attributes[i].nodeValue;

		return all;
	};

	feature.value = function()
	{
		return value;
	};

	feature.node = function()
	{
		return element;
	};

	feature.dom = function()
	{
		return element.ownerDocument;
	};

	feature.clean = function(done)
	{
		if (element.parentNode)
			element.parentNode.removeChild(element);

		if (done)
			done(null, feature);
	};

	feature.prepare = function(done)
	{
		if (done)
			done(null, feature);
	};

	feature.render = function(done)
	{
		if (done)
			done(null, feature);
	};

	init();
}


module.exports = TemplateFeature;
