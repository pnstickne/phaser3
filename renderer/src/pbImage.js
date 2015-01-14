/**
 *
 * Surface holder with a single pbSurface and a cellFrame index for the current animation cell.
 * 
 * This information cannot be stored in pbSurface (they are reused so the cellFrame needs to be unique)
 * and should not be in pbSprite (it's a logical transform object with an optional image attached).
 *
 * These objects will usually be one per pbSprite, but can safely be shared if a large number of pbSprite
 * objects will animate entirely in sync.  Be careful not to update the cellFrame in every pbSprite though!
 *
 * TODO: this class might be a good place to build drawing lists in order to permit fast batch drawing via a surface dictionary
 *
 */


function pbImage()
{
	this.renderer = null;
	this.surface = null;
	this.cellFrame = 0;
	this.gpuTexture = null;
	this.corners = null;
}


pbImage.prototype.create = function(_renderer, _surface, _cellFrame)
{
	if (_cellFrame === undefined || _cellFrame === null) _cellFrame = 0;

	this.renderer = _renderer;
	this.surface = _surface;
	this.cellFrame = _cellFrame;
	this.gpuTexture = null;
	this.corners = null;
};


/**
 * setCorners - specify the x,y offset of each corner of the drawn quadrilateral (for perspective/skewing type effects)
 * l = left, r = right, t = top, b = bottom
 * call with no parameters to clear the existing corners back to default (no offset)
 *
 * @param {[type]} ltx [description]
 * @param {[type]} lty [description]
 * @param {[type]} rtx [description]
 * @param {[type]} rty [description]
 * @param {[type]} lbx [description]
 * @param {[type]} lby [description]
 * @param {[type]} rbx [description]
 * @param {[type]} rby [description]
 */
pbImage.prototype.setCorners = function(ltx, lty, rtx, rty, lbx, lby, rbx, rby)
{
	if (ltx === undefined)
		this.corners = null;
	else
		this.corners = { ltx:ltx, lty:lty, rtx:rtx, rty:rty, lbx:lbx, lby:lby, rbx:rbx, rby:rby };
};


pbImage.prototype.destroy = function()
{
	this.renderer = null;
	this.surface = null;
	this.gpuTexture = null;
	this.corners = null;
};


pbImage.prototype.preUpdate = function()
{
	this.dictionary.clear();
};


pbImage.prototype.draw = function(_drawDictionary, _transform, _z_order)
{
	// TODO: produce batches of images in each layer which all use the same source surface. Draw them using the much faster batch draw options
	//this.renderer.graphics.drawImageWithTransform( _transform, _z_order, this.surface, this.cellFrame );

	_drawDictionary.add( this.surface, { renderer: this.renderer, transform: _transform, corners: this.corners, z_order: _z_order, surface: this.surface, cellFrame: this.cellFrame });
};

