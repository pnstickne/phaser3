/**
 *
 * Logical container for a pbImage with transforms.
 * 
 */


function pbSprite()
{
	this.alive = false;
	this.visible = false;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.angleInRadians = 0;
	this.scaleX = 0;
	this.scaleY = 0;
	this.image = null;
	this.children = null;
	this.parent = null;
	this.transform = null;
}


pbSprite.prototype.create = function(_image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY)
{
	if (_image === undefined) _image = null;

	this.image = _image;

	this.parent = null;
	this.alive = true;
	this.visible = true;

	this.x = _x;
	this.y = _y;
	this.z = _z;
	this.angleInRadians = _angleInRadians;
	this.scaleX = _scaleX;
	this.scaleY = _scaleY;

	this.transform = pbMatrix3.makeTransform(_x, _y, _angleInRadians, _scaleX, _scaleY);
};


pbSprite.prototype.destroy = function()
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


pbSprite.prototype.update = function(_drawDictionary)
{
	if (!this.alive)
		return true;

	var ax = this.x + this.width * this.anchorX;
	var ay = this.y + this.height * this.anchorY;

	// build the transform matrix from parent and my own transform member variables
	if (!this.parent || !this.parent.transform)
		pbMatrix3.setTransform(this.transform, ax, ay, this.angleInRadians, this.scaleX, this.scaleY);
	else
		pbMatrix3.setFastMultiply(this.transform, pbMatrix3.makeTransform(this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY), this.parent.transform);
	
	// draw if this sprite has an image
	if (this.image)
		this.image.draw(_drawDictionary, this.transform, this.z);

	if (this.children)
	{
		// for all of my child sprites
		for(var c = this.children.length - 1; c >= 0; --c)
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


pbSprite.prototype.kill = function()
{
	this.alive = false;
};


pbSprite.prototype.revive = function()
{
	this.alive = true;
};


pbSprite.prototype.addChild = function(_child)
{
	if (!this.children)
		this.children = [];
	this.children.push(_child);
	_child.parent = this;
};


pbSprite.prototype.addChildAt = function(_child, _index)
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


pbSprite.prototype.removeChild = function(_child)
{
	if (!this.children) return;
	var index = this.children.indexOf(_child);
	if (index != -1)
	{
		this.removeChildAt(index);
	}
	// else // TODO: error or warning!
};


pbSprite.prototype.removeChildAt = function(_index)
{
	if (!this.children) return;
	if (this.children.length <= _index) return;
	this.children[_index].parent = null;
	this.children.splice(_index, 1);
};

