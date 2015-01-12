/**
 *
 * A container for an Image surface (TODO: or other types of graphics object, pbImage abstracts them all)
 *
 * 
 */


function pbImage()
{
	this.renderer = null;
	this.surface = null;
	this.cellFrame = 0;
}


pbImage.prototype.create = function(_renderer, _surface, _cellFrame)
{
	if (_cellFrame === undefined || _cellFrame === null) _cellFrame = 0;

	this.renderer = _renderer;
	this.surface = _surface;
	this.cellFrame = _cellFrame;
};


pbImage.prototype.destroy = function()
{
	this.renderer = null;
	this.surface = null;
};


pbImage.prototype.draw = function(_transform, _z_order)
{
	// TODO: produce batches of images in each layer which all use the same source surface. Draw them using the much faster batch draw options
	this.renderer.graphics.drawImageWithTransform( _transform, _z_order, this.surface, this.cellFrame );
};

