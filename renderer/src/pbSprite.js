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

	// try to apply anchor offset prior to rotation so things rotate around anchor instead of their 0,0 (centre for pbSprite, top-left corner for pbLayer)
	// if (_image)
	// {
	// 	// TODO: merge these combinations into a specialised pbMatrix3 function when we've got them working correctly
	// 	var anchorTransform = pbMatrix3.makeTranslation(this.image.anchorX * this.image.surface.cellWide, this.image.anchorY * this.image.surface.cellHigh);
	// 	this.transform = pbMatrix3.fastMultiply(anchorTransform, pbMatrix3.makeTransform(_x, _y, _angleInRadians, _scaleX, _scaleY));
	// }
	// else
	{
		this.transform = pbMatrix3.makeTransform(_x, _y, _angleInRadians, _scaleX, _scaleY);
	}
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

	// set my own transform matrix
	pbMatrix3.setTransform(this.transform, this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY);
	// multiply with the transform matrix from my parent
	if (this.parent && this.parent.transform)
		pbMatrix3.setFastMultiply(this.transform, this.transform, this.parent.transform);
	
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


pbSprite.prototype.simpleUpdate = function(_drawList)
{
	if (!this.alive)
		return true;

	// add this sprite to the drawList
	_drawList.push( { x: this.x, y: this.y } );

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

