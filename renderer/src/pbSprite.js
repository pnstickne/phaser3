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


pbSprite.prototype.create = function(_parent, _image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY)
{
	if (_parent === undefined) _parent = null;
	this.parent = _parent;

	if (_image === undefined) _image = null;
	this.image = _image;

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
	for(var c = this.children.length - 1; c >= 0; --c)
		this.children[c].destroy();
	this.children = null;
	this.parent = null;
	this.image = null;
	this.transform = null;
};


pbSprite.prototype.update = function()
{
	if (!this.alive)
		return true;

	// build the transform matrix from parent and my own transform member variables
	if (!this.parent || !this.parent.transform)
		this.transform = pbMatrix3.makeTransform(this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY);
	else
		this.transform = pbMatrix3.matrixMultiply(this.parent.transform, pbMatrix3.makeTransform(this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY));
	
	// draw if this sprite has an image
	if (this.image)
		this.image.draw(this.transform, this.z);

	if (this.children)
	{
		// for all of my child sprites
		for(var c = this.children.length - 1; c >= 0; --c)
		{
			var child = this.children[c];

			// update this child
			if (!child.update())
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
};


pbSprite.prototype.addChildAt = function(_child, _index)
{
	if (!this.children)
		this.children = [];
	if (_index <= this.children.length)
		this.children.splice(_index, 0, _child);
	//else // TODO: error or warning!
};


pbSprite.prototype.removeChild = function(_child)
{
	if (!this.children) return;
	var index = this.children.indexOf(_child);
	if (index != -1)
		this.removeChildAt(_index);
	// else // TODO: error or warning!
};


pbSprite.prototype.removeChildAt = function(_index)
{
	if (!this.children) return;
	if (this.children.length <= _index) return;
	this.children.splice(_index, 1);
};

