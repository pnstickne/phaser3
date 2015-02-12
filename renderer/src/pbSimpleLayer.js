/**
 *
 * pbSimpleLayer - Contains one layer of multiple pbSprite objects, simple layer does not permit rotation/scaling or nested children.
 *
 */


function pbSimpleLayer()
{
	this.parent = null;
	this.renderer = null;
	this.surface = null;
	this.drawList = null;
}

// pbSimpleLayer extends from the pbSprite prototype chain
pbSimpleLayer.prototype = new pbSprite();
// create property to store the class' parent
pbSimpleLayer.prototype.__super__ = pbSprite;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript


pbSimpleLayer.prototype.create = function(_parent, _renderer, _x, _y, _surface)
{
	this.parent = _parent;
	this.renderer = _renderer;
	// call the pbSprite create for this pbSimpleLayer
	this.__super__.prototype.create.call(this, null, _x, _y);
	this.surface = _surface;
	this.drawList = [];
};


pbSimpleLayer.prototype.destroy = function()
{
	// call the pbSprite destroy for this pbSimpleLayer
	this.__super__.prototype.destroy.call(this);
	this.parent = null;
	this.renderer = null;
	this.surface = null;
	this.drawList = null;
};


pbSimpleLayer.prototype.update = function(_dictionary)
{
	// avoid creating a new array each frame by reusing this.drawList and simply keeping track of where we are in it
	var drawLength = 0;

	if (!this.alive)
		return true;

	if (this.children)
	{
		// for all of my child sprites
		var c = this.children.length;
		while(c--)
		{
			var child = this.children[c];

			// avoid function call by in-lining the pbSprite.simpleUpdate contents here
			if (child.alive)
			{
				var d = this.drawList[drawLength];
				if (d)
				{
					d.x = child.x;
					d.y = child.y;
				}
				else
				{
					this.drawList[drawLength] = { x: child.x, y: child.y };
				}
				drawLength++;
			}
		}
	}

	if (drawLength > 0)
		this.draw(this.drawList, drawLength);

	return true;
};


pbSimpleLayer.prototype.draw = function(_list, _length)
{
//	this.renderer.graphics.blitSimpleDrawImages( _list, _length, this.surface );
	this.renderer.graphics.blitDrawImagesPoint( _list, _length, this.surface );
};


/**
 * override the pbSprite addChild function to ensure that only pbSprite is added to this pbSimpleLayer
 *
 * @param {[type]} _child [description]
 */
pbSimpleLayer.prototype.addChild = function( _child )
{
	if (_child instanceof pbSprite)
	{
		// call the super.addChild function
		this.__super__.prototype.addChild.call( this, _child );
	}
	else
	{
		console.log("ERROR: can ONLY addChild a pbSprite to a pbSimpleLayer!");
	}
};

