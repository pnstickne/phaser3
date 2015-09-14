/**
 *
 * pbCamera - pbTransformObject 'view' of a pbBaseLayer
 * 
 */


function pbCamera()
{
	this.super(pbBaseLayer, 'constructor');

	this.list = null;
	this.parent = null;
	this.phaserRender = null;
	this.clip = null;
}

// pbBaseLayer extends from the pbTransformObject prototype chain
// permits multiple levels of inheritance 	http://jsfiddle.net/ZWZP6/2/  
// improvement over original answer at 		http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript
pbCamera.prototype = new pbTransformObject();
pbCamera.prototype.constructor = pbCamera;
pbCamera.prototype.__super__ = pbTransformObject;


pbCamera.prototype.create = function(_x, _y, _z, _angleInRadians, _scaleX, _scaleY)
{
	// console.log("pbCamera.create", _x, _y);
	
	// call the pbTransformObject create for this pbBaseLayer
	this.super(pbBaseLayer, 'create', null, _x, _y, _z, _angleInRadians, _scaleX, _scaleY);

	this.list = [];
};


pbCamera.prototype.setClipping = function(_x, _y, _width, _height)
{
	this.clip = new pbRectangle(_x, _y, _width, _height);
};


pbCamera.prototype.destroy = function()
{
	// call the pbTransformObject destroy for this pbBaseLayer
	this.super(pbBaseLayer, 'destroy');

	this.clip = null;

	this.phaserRender = null;

	if (this.parent && this.parent.list)
	{
		var i = this.parent.list.indexof(this);
		if (i != -1)
			this.parent.list.splice(i, 1);
	}
	this.parent = null;
	this.list = null;
};


pbCamera.prototype.update = function(_drawList, rootLayer)
{
	// console.log("pbCamera.update");
	// call the pbTransformObject update for this pbBaseLayer to access the child hierarchy
	rootLayer.update(_drawList, this.transform);
};


/**
 * override the pbTransformObject addChild function to handle case where a pbBaseLayer is added to a pbBaseLayer
 * in that case it should go into list instead of children in order to provide the correct order of processing
 *
 * @param {[type]} _child [description]
 */
pbCamera.prototype.addChild = function( _child )
{
	throw new "Camera has no children"
};
