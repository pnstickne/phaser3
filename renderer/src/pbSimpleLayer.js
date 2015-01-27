/**
 *
 * pbSimpleLayer - Contains one layer of multiple pbSprite objects, simple layer does not permit rotation/scaling or nested children.
 *
 */


function pbSimpleLayer()
{
	this.surface = null;
	this.renderer = null;
	this.parent = null;
}

// pbSimpleLayer extends from the pbSprite prototype chain
pbSimpleLayer.prototype = new pbSprite();
// create property to store the class' parent
pbSimpleLayer.prototype.__super__ = pbSprite;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript


pbSimpleLayer.prototype.create = function(_parent, _x, _y, _surface, _renderer)
{
	this.parent = _parent;
	// call the pbSprite create for this pbSimpleLayer
	this.__super__.prototype.create.call(this, null, _x, _y);
	this.surface = _surface;
	this.renderer = _renderer;
};


pbSimpleLayer.prototype.destroy = function()
{
	// call the pbSprite destroy for this pbSimpleLayer
	this.__super__.prototype.destroy.call(this);
	this.parent = null;
};


pbSimpleLayer.prototype.update = function(_dictionary)
{
	var drawList = [];

	if (!this.alive)
		return true;

	if (this.children)
	{
		// for all of my child sprites
		for(var c = this.children.length - 1; c >= 0; --c)
		{
			var child = this.children[c];

			// update this child
			if (!child.simpleUpdate(drawList))
			{
				child.destroy();
				this.removechildAt(c);
			}
		}
	}

	if (drawList.length > 0)
		this.draw(drawList);

	return true;
};


pbSimpleLayer.prototype.draw = function(_list)
{
	var l = _list.length;
	this.renderer.graphics.blitSimpleDrawImages( _list, this.surface );
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

