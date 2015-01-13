/**
 *
 * pbLayer - Contains one layer of multiple pbSprite objects.
 *
 * All sprites held in a layer are z-sorted using the pbSprite.z coordinate which uses a webgl shader hack for depth buffering.
 * Sprites held in a layer are therefore eligible for high-speed batch drawing when they share a source surface.
 * 
 * TODO: Layers will inherit from pbSprite to acquire the nested hierarchy and transform inheritance already implemented there.
 * Layers will not have a surface though, so they use pbSprite purely as a logical construct and not as a display object.
 * TODO: Check if 'layers' are even necessary as a unique object, pbSprite might already contain the full requisite functionality!
 * 
 */


function pbLayer()
{
	this.list = null;
	this.parent = null;
}

// pbLayer extends from the pbSprite prototype chain
pbLayer.prototype = new pbSprite();
// create property to store the class' parent
pbLayer.prototype.__super__ = pbSprite;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript


pbLayer.prototype.create = function(_parent, _x, _y, _z, _angleInRadians, _scaleX, _scaleY)
{
	this.parent = _parent;
	// call the pbSprite create for this pbLayer
	this.__super__.prototype.create.call(this, null, _x, _y, _z, _angleInRadians, _scaleX, _scaleY);
	this.list = [];
};


pbLayer.prototype.destroy = function()
{
	// call the pbSprite destroy for this pbLayer
	this.__super__.prototype.destroy.call(this);
	this.parent = null;
	this.list = null;
};


pbLayer.prototype.add = function()
{
	var sprite = new pbSprite();

	this.list.push(sprite);
};


pbLayer.prototype.update = function()
{
	// call update for all members of this layer
	for(var i = this.list.length - 1; i >= 0; --i)
	{
		var member = this.list[i];
		if (!member.update())
		{
			member.destroy();
			this.list.splice(i, 1);
		}
	}

	// call the pbSprite update for this pbLayer to access the child hierarchy
	this.__super__.prototype.update.call(this);

	return true;
};

