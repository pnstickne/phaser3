/**
 *
 * pbBaseLayer3D - Base class for 3D Layers, contains one layer of multiple pbSprite3D objects.
 *
 */


function pbBaseLayer3D()
{
	this.super(pbBaseLayer3D, 'constructor');

	this.list = null;
	this.parent = null;
	this.renderer = null;
	this.clip = null;
}

// pbBaseLayer3D extends from the pbSprite3D prototype chain
// permits multiple levels of inheritance 	http://jsfiddle.net/ZWZP6/2/  
// improvement over original answer at 		http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript
pbBaseLayer3D.prototype = new pbSprite3D();
pbBaseLayer3D.prototype.constructor = pbBaseLayer3D;
pbBaseLayer3D.prototype.__super__ = pbSprite3D;


pbBaseLayer3D.prototype.create = function(_parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY)
{
	// console.log("pbBaseLayer3D.create", _x, _y);
	
	// call the pbSprite3D create for this pbBaseLayer3D
	this.super(pbBaseLayer3D, 'create', null, _x, _y, _z, _angleInRadians, _scaleX, _scaleY);

	// TODO: add pass-through option so that layers can choose not to inherit their parent's transforms and will use the rootLayer transform instead
	// TODO: pbBaseLayer3D is rotating around it's top-left corner (because there's no width/height and no anchor point??)

	this.renderer = _renderer;

	this.parent = _parent;
	this.list = [];
};


pbBaseLayer3D.prototype.setClipping = function(_x, _y, _width, _height)
{
	this.clip = new pbRectangle(_x, _y, _width, _height);
};


pbBaseLayer3D.prototype.destroy = function()
{
	// call the pbSprite3D destroy for this pbBaseLayer3D
	this.super(pbBaseLayer3D, 'destroy');

	this.clip = null;

	this.renderer = null;

	if (this.parent && this.parent.list)
	{
		var i = this.parent.list.indexof(this);
		if (i != -1)
			this.parent.list.splice(i, 1);
	}
	this.parent = null;
	this.list = null;
};


pbBaseLayer3D.prototype.update = function(_drawList)
{
	// console.log("pbBaseLayer3D.update");
	// call the pbSprite3D update for this pbBaseLayer3D to access the child hierarchy
	this.super(pbBaseLayer3D, 'update', _drawList);
};


pbBaseLayer3D.prototype.draw = function(_list)
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
 * override the pbSprite3D addChild function to handle case where a pbBaseLayer3D is added to a pbBaseLayer3D
 * in that case it should go into list instead of children in order to provide the correct order of processing
 *
 * @param {[type]} _child [description]
 */
pbBaseLayer3D.prototype.addChild = function( _child )
{
	// console.log("pbBaseLayer3D.addChild", this.list.length);

	// TODO: debug only, catches hard to track error that can propagate down through multiple layers and sprites hierarchies
	if (_child === undefined || _child === null)
		alert("ERROR: pbBaseLayer3D.addChild received an invalid _child", _child);

	if ((_child instanceof pbBaseLayer3D) || (_child instanceof pbCanvasLayer) || (_child instanceof pbWebGlLayer) || (_child instanceof pbSimpleLayer))
	{
		this.list.push( _child );
		_child.parent = this;
	}
	else
	{
		// call the super.addChild function
		this.super(pbBaseLayer3D, 'addChild', _child);
	}
};


pbBaseLayer3D.prototype.removeChild = function( _child )
{
	// console.log("pbBaseLayer3D.removeChild", this.list.length);

	if ((_child instanceof pbBaseLayer3D) || (_child instanceof pbCanvasLayer) || (_child instanceof pbWebGlLayer) || (_child instanceof pbSimpleLayer))
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
		this.super(pbBaseLayer3D, 'removeChild', _child);
	}
};

