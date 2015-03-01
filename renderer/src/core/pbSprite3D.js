/**
 *
 * Logical container for a pbImage with 3D transforms.
 * 
 */


function pbSprite3D()
{
	this.alive = false;
	this.visible = false;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.rx = 0;
	this.ry = 0;
	this.rz = 0;
	this.scaleX = 0;
	this.scaleY = 0;
	this.scaleZ = 0;
	this.image = null;
	this.children = null;
	this.parent = null;
	this.transform = null;
}


/**
 * [create description]
 *
 * @param  {[type]} _image          [description]
 * @param  {[type]} _x              [description]
 * @param  {[type]} _y              [description]
 * @param  {Number [0..1]} _z - depth to draw this image at, 0 is in front, 1 is at the back
 * @param  {[type]} _angleInRadians [description]
 * @param  {[type]} _scaleX         [description]
 * @param  {[type]} _scaleY         [description]
 *
 * @return {[type]}                 [description]
 */
pbSprite3D.prototype.create = function(_image, _x, _y, _z, _rx, _ry, _rz, _scaleX, _scaleY, _scaleZ)
{
	// console.log("pbSprite3D.create");

	if (_image === undefined) _image = null;

	this.image = _image;

	this.parent = null;
	this.alive = true;
	this.visible = true;

	this.x = _x;
	this.y = _y;
	this.z = _z;
	this.rx = _rx;
	this.ry = _ry;
	this.rz = _rz;
	this.scaleX = _scaleX;
	this.scaleY = _scaleY;
	this.scaleZ = _scaleZ;

	this.transform = pbMatrix4.makeTransform(_x, _y, _z, _rx, _ry, _rz, _scaleX, _scaleY, _scaleZ);
};


pbSprite3D.prototype.destroy = function()
{
	// destroy all my children too
	if (this.children)
		for(var c = this.children.length - 1; c >= 0; --c)
			this.children[c].destroy();
	this.children = null;

	// remove me from my parent
	if (this.parent)
		this.parent.removeChild(this);
	this.parent = null;

	this.image = null;
	this.transform = null;
};


pbSprite3D.prototype.update = function(_drawDictionary)
{
	// console.log("pbSprite3D.update");

	if (!this.alive)
		return true;

	// set my own transform matrix
	pbMatrix4.setTransform(this.transform, this.x, this.y, this.z, this.rx, this.ry, this.rz, this.scaleX, this.scaleY, this.scaleZ);
	// multiply with the transform matrix from my parent
	if (this.parent && this.parent.transform)
		pbMatrix4.setFastMultiply(this.transform, this.parent.transform);
	
	// draw if this sprite has an image
	if (this.image)
		this.image.draw(_drawDictionary, this.transform, this.z);

	if (this.children)
	{
		// for all of my child sprites
		var c = this.children.length;
		while(c--)
		{
			var child = this.children[c];

			// update this child
			if (!child.update(_drawDictionary))
			{
				child.destroy();
				this.removechildAt(c);
			}
		}
	}

	return true;
};


pbSprite3D.prototype.kill = function()
{
	this.alive = false;
};


pbSprite3D.prototype.revive = function()
{
	this.alive = true;
};


pbSprite3D.prototype.addChild = function(_child)
{
	if (!this.children)
		this.children = [];

	// console.log("pbSprite3D.addChild", this.children.length);
	
	this.children.push(_child);
	_child.parent = this;
};


pbSprite3D.prototype.addChildAt = function(_child, _index)
{
	if (!this.children)
		this.children = [];
	if (_index <= this.children.length)
	{
		this.children.splice(_index, 0, _child);
		_child.parent = this;
	}
	//else // TODO: error or warning!
};


pbSprite3D.prototype.removeChild = function(_child)
{
	if (!this.children) return;
	var index = this.children.indexOf(_child);
	if (index != -1)
	{
		this.removeChildAt(index);
	}
	// else // TODO: error or warning!
};


pbSprite3D.prototype.removeChildAt = function(_index)
{
	if (!this.children) return;
	if (this.children.length <= _index) return;
	this.children[_index].parent = null;
	this.children.splice(_index, 1);
};


// allow this class to be extended
// permits multiple levels of inheritance 	http://jsfiddle.net/ZWZP6/2/  
// improvement over original answer at 		http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript
pbSprite3D.prototype.super = function(clazz, functionName)
{
	// console.log("pbSprite3D.super", functionName);
    var args = Array.prototype.slice.call(arguments, 2);
    clazz.prototype.__super__.prototype[functionName].apply(this, args);
};

