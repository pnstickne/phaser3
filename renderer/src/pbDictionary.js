/**
 *
 * A very simple Dictionary implementation in JS
 *
 * Uses the key as a property on the values object.
 * Permits multiple values to be stored to a single key.
 * 
 */


function pbDictionary()
{
	this.values = null;
}


pbDictionary.prototype.create = function()
{
	this.clear();
};


pbDictionary.prototype.add = function(_key, _value)
{
	var v = this.values[_key];
	if (v === undefined || v === null)
	{
		// key does not exist, create new list of matching values
		this.values[_key] = [ _value ];
	}
	else
	{
		// key exists, add value to the end of the list of matching values
		this.values[_key].push(_value);
	}
};


pbDictionary.prototype.get = function(_key)
{
	var v = this.values[_key];
	if (v === undefined || v === null)
		// key does not exist
		return null;
	// key exists, return list of matching values
	return this.values[_key];
};


pbDictionary.prototype.remove = function(_key)
{
	var v = this.values[_key];
	if (v === undefined || v === null)
		// key does not exist
		return null;

	// key exists, return list of matching values
	this.values[_key] = null;
	return list;
};


pbDictionary.prototype.clear = function()
{
	this.values = [];
};


pbDictionary.prototype.iterateAll = function(_func, _context)
{
	var v = this.values;
	for(var k in v)
		if (v.hasOwnProperty(k))
			for(var j = 0, m = v[k].length; j < m; j++)
				_func.call(_context, v[k][j]);
};


pbDictionary.prototype.iterateKeys = function(_func, _context)
{
	var v = this.values;
	for(var k in v)
		if (v.hasOwnProperty(k))
			_func.call(_context, v[k]);
};

