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
 * TODO: given rootLayer -> layer1 -> layer2 -> layer3, rotating all layers except layer3 works as expected... what's wrong with layer3?!
 * 
 */


function pbLayer()
{
	this.list = null;
	this.parent = null;
	this.renderer = null;
	this.drawDictionary = null;
}

// pbLayer extends from the pbSprite prototype chain
pbLayer.prototype = new pbSprite();
// create property to store the class' parent
pbLayer.prototype.__super__ = pbSprite;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript


pbLayer.prototype.create = function(_parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY)
{
	// TODO: add pass-through option so that layers can choose not to inherit their parent's transforms and will use the rootLayer transform instead
	 
	// TODO: pbLayer is rotating around it's top-left corner (because there's no width/height and no anchor point??)

	this.renderer = _renderer;

	// create dictionary to store drawing commands in the correct order, indexed by the source surface
	// to prepare the data for fast batch drawing
	this.drawDictionary = new pbDictionary();
	this.drawDictionary.create();
	 
	this.parent = _parent;
	// call the pbSprite create for this pbLayer
	this.__super__.prototype.create.call(this, null, _x, _y, _z, _angleInRadians, _scaleX, _scaleY);
	this.list = [];
};


pbLayer.prototype.destroy = function()
{
	// call the pbSprite destroy for this pbLayer
	this.__super__.prototype.destroy.call(this);
	this.renderer = null;
	if (this.parent && this.parent.list)
	{
		var i = this.parent.list.indexof(this);
		if (i != -1)
			this.parent.list.splice(i, 1);
	}

	this.parent = null;
	this.list = null;
	this.drawDictionary = null;
};


pbLayer.prototype.update = function(_dictionary)
{
	// TODO: check this dictionary implementation works correctly with nested layers, nested sprites, and combinations of both
	// prepare the dictionary
	if (!this.drawDictionary)
		console.log("ERROR: no dictionary on layer!");

	this.drawDictionary.clear();

	// call the pbSprite update for this pbLayer to access the child hierarchy
	this.__super__.prototype.update.call(this, this.drawDictionary);

	// iterate the drawDictionary to obtain all values for each key
	// draw the queued objects in the callback
	this.drawDictionary.iterateKeys(this.draw, this);

	// call update for all members of this layer
	// (pbImage adds drawing data to the drawDictionary)
	for(var i = this.list.length - 1; i >= 0; --i)
	{
		var member = this.list[i];

		if (!member.update(this.drawDictionary))
		{
			member.destroy();
			this.list.splice(i, 1);
		}
	}

	return true;
};


pbLayer.prototype.draw = function(_list)
{
	var obj = _list[0];
	
	if (_list.length === 1)
	{
		this.renderer.graphics.drawImageWithTransform( obj.image, obj.transform, obj.z_order );
	}
	else if (obj.image.isParticle)
	{
		this.renderer.graphics.blitDrawImages( _list, obj.image.surface );
	}
	else
	{
		this.renderer.graphics.rawBatchDrawImages( _list );
	}
};


/**
 * override the pbSprite addChild function to handle case where a pbLayer is added to a pbLayer
 * in that case it should go into list instead of children in order to provide the correct order of processing
 *
 * @param {[type]} _child [description]
 */
pbLayer.prototype.addChild = function( _child )
{
	if ((_child instanceof pbLayer) || (_child instanceof pbSimpleLayer))
	{
		this.list.push( _child );
		_child.parent = this;
	}
	else
	{
		// call the super.addChild function
		this.__super__.prototype.addChild.call( this, _child );
	}
};


pbLayer.prototype.removeChild = function( _child )
{
	if ((_child instanceof pbLayer) || (_child instanceof pbSimpleLayer))
	{
		if (!this.list) return;
		var index = this.list.indexOf(_child);
		if (index != -1 && index < this.list.length)
		{
			this.list[index].parent = null;
			this.list.splice(index, 1);
		}
	}
	else
	{
		// call the super.removeChild function
		this.__super__.prototype.removeChild.call( this, _child );
	}
};

