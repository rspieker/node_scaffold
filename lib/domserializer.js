/*
 *  Serialize a DOM Tree created by the XMLDOM module
 *  @name    DOMSerializer
 *  @package Scaffold
 */
function DOMSerializer()
{
	//  if an __instance property is found, the object is already constructed and should be returned
	if (DOMSerializer.prototype.__instance)
		return DOMSerializer.prototype.__instance;
	//  make a reference to 'this' and set it to be the __instance returned as singleton
	DOMSerializer.prototype.__instance = this;


	var serializer = this,
		//  default options
		defaults = {
			//  remove redundant white space
			preserveWhiteSpace: false,
			//  remove comments
			preserveComment: false
		},

		//  entity map
		entity = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			'"': '&quote;'
		},

		//  patterns (defined for the object instance so it can be cached)
		pattern = {
			//  match all string starting with html (case insensitive)
			html: /^html.*/i,
			//  attributes which do not require a value (HTML mode only)
			autoFill: /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
			//  nodes which do not allow content (TODO: move any content to after the the node)
			selfClosing: /^(?:area|base|basefont|br|col|command|embed|frame|hr|img|input|isindex|keygen|link|meta|param|source|track|wbr)$/i,
			//  nodes which do always require a closing tag
			endTag: /^(?:script|style)$/i,
			//  attribute values for which it is safe to leave out the quotes
			quoteLessAttribute: /^[^"'=><` ]+$/i,
			//  characters which are required to write as entities in text nodes
			encode: /[<&]/g,
			//  helper pattern to obtain one of xml, html, xhtml from the input (any doctype or processing instruction)
			detectFormat: /((?:x?)(?:ht)?ml)/i,
			preserveWhiteSpace: /pre|script/i
		}
	;

	//  public constants

	//  declare the types as they occur in the 'xmldom' module (which aligns with the DOM2 spec, of course)
	serializer.ELEMENT_NODE                = 1;
	serializer.ATTRIBUTE_NODE              = 2;
	serializer.TEXT_NODE                   = 3;
	serializer.CDATA_SECTION_NODE          = 4;
	serializer.ENTITY_REFERENCE_NODE       = 5;
	serializer.ENTITY_NODE                 = 6;
	serializer.PROCESSING_INSTRUCTION_NODE = 7;
	serializer.COMMENT_NODE                = 8;
	serializer.DOCUMENT_NODE               = 9;
	serializer.DOCUMENT_TYPE_NODE          = 10;
	serializer.DOCUMENT_FRAGMENT_NODE      = 11;
	serializer.NOTATION_NODE               = 12;



	/*
	 *  Resolve the entity value for given character
	 *  @name   encode
	 *  @type   function
	 *  @access internal
	 *  @param  string character
	 *  @return string entity
	 */
	function encode(character)
	{
		return character in entity ? entity[character] : '&#' + character.charCodeAt() + ';';
	}

	/*
	 *  Extract the available (if any) xml, xhtml, html string from given value
	 *  @name   detectFormat
	 *  @type   function
	 *  @access internal
	 *  @param  string value
	 *  @return string output format
	 */
	function detectFormat(value)
	{
		var match = value.match(pattern.detectFormat);

		return match ? match[0].toLowerCase() : defaults.format;
	}

	/*
	 *  Determine if the given format matches the HTML pattern
	 *  @name   isHTML
	 *  @type   function
	 *  @access internal
	 *  @param  string output format
	 *  @return bool   html
	 */
	function isHTML(format)
	{
		return pattern.html.test(format || defaults.format);
	}

	/*
	 *  Determine if the attribute requires a value (HTML mode only)
	 *  @name   isAutoFill
	 *  @type   function
	 *  @access internal
	 *  @param  string attribute name
	 *  @param  string output format
	 *  @return bool   autofill
	 */
	function isAutoFill(name, format)
	{
		return isHTML(format) && pattern.autoFill.test(name);
	}

	/*
	 *  Determine if the attribute value must be quoted (quoted may be omitted in HTML mode only)
	 *  @name   quoteAttribute
	 *  @type   function
	 *  @access internal
	 *  @param  string attribute value
	 *  @param  string output format
	 *  @return string quote char
	 */
	function quoteAttribute(value, format)
	{
		var quote = '"';
		if (isHTML(format))
		{
			if (pattern.quoteLessAttribute.test(value))
				quote = '';
			else if (value.indexOf('"') >= 0)
				quote = "'";
		}
		return quote;
	}

	/*
	 *  Determine if the element must self close
	 *  @name   isSelfClosing
	 *  @type   function
	 *  @access internal
	 *  @param  string node name
	 *  @return bool   selfclose
	 */
	function isSelfClosing(name)
	{
		return pattern.selfClosing.test(name);
	}

	/*
	 *  Determine if a closing tag is required (HTML mode only)
	 *  @name   isEndTagMandatory
	 *  @type   function
	 *  @access internal
	 *  @param  string node name
	 *  @param  string output format
	 *  @return bool   required
	 */
	function isEndTagMandatory(name, format)
	{
		return isHTML(format) && pattern.endTag.test(name);
	}


	/*
	 *  Build a string representation of the given DOM-node
	 *  @name   serializeToString
	 *  @type   function
	 *  @access internal
	 *  @param  DOMNode
	 *  @param  Array  buffer
	 *  @param  object options
	 *  @return void
	 *  @return the buffer param acts as output variable, it'll get modified
	 */
	function serializeToString(node, buffer, options)
	{
		var child, close, value, i;

		switch(node.nodeType)
		{
			case serializer.ELEMENT_NODE:
				child = node.firstChild;
				close = isSelfClosing(node.tagName);

				buffer.push('<', node.tagName);

				for (i = 0; i < node.attributes.length; ++i)
					serializeToString(node.attributes.item(i), buffer, options);

				if (child || !close)
				{
					buffer.push('>');
					while (child)
					{
						serializeToString(child, buffer, options);
						child = child.nextSibling;
					}
					buffer.push('</', node.tagName, '>');
				}
				else
				{
					if (!isHTML(options.format))
						buffer.push('/');
					buffer.push('>');
				}
				return;

			case serializer.ATTRIBUTE_NODE:
				if (isAutoFill(node.name, options.format))
					return buffer.push(' ', node.name);
				close = quoteAttribute(node.value, options.format);
				return buffer.push(' ', node.name, '=', close, (node.value || node.name), close);

			case serializer.DOCUMENT_NODE:
			case serializer.DOCUMENT_FRAGMENT_NODE:
				child = node.firstChild;

				while (child)
				{
					serializeToString(child, buffer, options);
					child = child.nextSibling;
				}
				return;

			case serializer.TEXT_NODE:
				value = node.data.replace(pattern.encode, encode);
				if (!pattern.preserveWhiteSpace.test(node.parentNode.tagName))
				{
					if (!options.preserveWhiteSpace)
						value = value.replace(/\s+/g, ' ');
				}
				return buffer.push(value);

			case serializer.CDATA_SECTION_NODE:
				return buffer.push('<![CDATA[', node.data, ']]>');

			case serializer.COMMENT_NODE:
				if ('function' === typeof options.preserveComment ? options.preserveComment(node.data) : options.preserveComment)
					buffer.push('<!--', node.data, '-->');
				return;

			case serializer.DOCUMENT_TYPE_NODE:
				if (!options.format)
					options.format = detectFormat(node.publicId || node.systemId || node.name);

				buffer.push('<!DOCTYPE ', node.name);

				if (node.publicId)
					buffer.push(' PUBLIC "', node.publicId, '"');

				if (node.systemId && node.systemId !== '.')
				{
					if (!node.publicId)
						buffer.push(' SYSTEM');
					buffer.push(' "', node.systemId, '"');
				}

				if (node.internalSubset)
					buffer.push(' [', node.internalSubset, ']');

				buffer.push('>');
				return;

			case serializer.PROCESSING_INSTRUCTION_NODE:
				if (!options.format)
					options.format = detectFormat(node.target || node.data);

				return buffer.push('<?', node.target, ' ', node.data, '?>');

			case serializer.ENTITY_REFERENCE_NODE:
				return buffer.push('&', node.nodeName, ';');

			//case ENTITY_NODE:
			//case NOTATION_NODE:
			default:
				buffer.push('??', node.nodeName);
				break;
		}
	}

	/*
	 *  Build a string representation of the given DOM-tree
	 *  @name   serializeToString
	 *  @type   method
	 *  @access public
	 *  @param  DOMNode
	 *  @param  object options
	 *  @return string
	 */
	serializer.serializeToString = function(dom, options)
	{
		var buffer = [],
			p;

		if ('object' !== typeof options)
		{
			options = defaults;
		}
		else
		{
			//  inherit from defaults
			for (p in defaults)
				if (!(p in options))
					options[p] = defaults[p];
		}

		serializeToString(dom, buffer, options || {});
		return buffer.join('');
	};
}

module.exports = function(dom, options)
{
	return new DOMSerializer().serializeToString(dom, options);
};