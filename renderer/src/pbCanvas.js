/**
 *
 * pbCanvas - wrapper for all Canvas drawing function
 * Must extend pbCanvas.js
 * http://stackoverflow.com/questions/3710275/does-javascript-have-the-interface-type-such-as-javas-interface
 * (I know JS doesn't support interfaces... but it's easier to talk about that way than constant 'duck' references!)
 * 
 */

function pbCanvas()
{
	this.ctx = null;
	this.canvas = null;
}


// pbCanvas extends from the pbBaseGraphics prototype chain
pbCanvas.prototype = new pbCanvas();
// create property to store the class' parent
pbCanvas.prototype.__super__ = pbCanvas;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript


pbCanvas.prototype.create = function( _canvas )
{
	if (_canvas)
	{
		this.canvas = _canvas;
		try
		{
			this.ctx = _canvas.getContext('2d');
		}
		catch ( e )
		{
			alert( "Canvas initialisation error: ", e.message );
			return false;
		}

		if (this.ctx)
			return true;
		alert( "Canvas Error: unable to getContext('2d')");
	}
	return false;
};


pbCanvas.prototype.destroy = function()
{
	this.canvas = null;
	this.ctx = null;
};


pbCanvas.prototype.preRender = function()
{
	// clear canvas before drawing contents
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};


// currently unused
pbCanvas.prototype.drawImage = function(_x, _y, _z, _surface, _cellFrame, _angle, _scale)
{
	alert("ERROR: Canvas graphic mode does not yet extend drawImage from pbBaseGraphics!");
};


// used by pbLayer for single sprite drawing
pbCanvas.prototype.drawImageWithTransform = function(_image, _transform, _z_order)
{
	var srf = _image.surface;
	var img = srf.image;

	// TODO: use the Pixi style 'object' matrix which is kept as elements so I don't need to extract from array.. after speed tests vs the glMatrix approach!
	var a = _transform[0];
	var b = _transform[3];
	var c = _transform[1];
	var d = _transform[4];
	var e = _transform[6];
	var f = _transform[7];

	// TODO: store scale in pbMatrix3 when it's set to avoid sqrt here... how best to deal with matrix multiplication for transform tree though?
	// var sx = Math.sqrt(a * a + b * b);
	// var sy = Math.sqrt(c * c + d * d);	
	var w = srf.cellWide;		// * sx;
	var h = srf.cellHigh;		// * sy;  TODO: I think this scale factor should be required but it works without... try with some larger images to check

	// TODO: 'fullScreen' flag... stretch to fit
	// TODO: apply skew factors if set
	// TODO: animation frame selection and extraction from the sprite-sheet

	this.ctx.save();
	this.ctx.transform(a, b, c, d, e, f);
	this.ctx.drawImage(img, -w * _image.anchorX, -h * _image.anchorY);
	this.ctx.restore();


	// // set up the animation frame
	// var cell = Math.floor(_image.cellFrame);
	// var rect = surface.cellTextureBounds[cell % surface.cellsWide][Math.floor(cell / surface.cellsWide)];

	// var wide, high;
	// if (_image.fullScreen)
	// {
	// 	rect.width = gl.drawingBufferWidth / surface.cellWide;
	// 	rect.height = gl.drawingBufferHeight / surface.cellHigh;
	// 	wide = gl.drawingBufferWidth;
	// 	high = gl.drawingBufferHeight;
	// }
	// else
	// {
	// 	// half width, half height (of source frame)
	// 	wide = surface.cellWide;
	// 	high = surface.cellHigh;
	// }

	// // screen destination position
	// // l, b,		0,1
	// // l, t,		4,5
	// // r, b,		8,9
	// // r, t,		12,13
	// if (_image.corners)
	// {
	// 	var cnr = _image.corners;
	// 	l = -wide * _image.anchorX;
	// 	r = wide + l;
	// 	t = -high * _image.anchorY;
	// 	b = high + t;
	// 	// object has corner offets (skewing/perspective etc)
	// 	buffer[ 0 ] = cnr.lbx * l; buffer[ 1 ] = cnr.lby * b;
	// 	buffer[ 4 ] = cnr.ltx * l; buffer[ 5 ] = cnr.lty * t;
	// 	buffer[ 8 ] = cnr.rbx * r; buffer[ 9 ] = cnr.rby * b;
	// 	buffer[ 12] = cnr.rtx * r; buffer[ 13] = cnr.rty * t;
	// }
	// else
	// {
	// 	l = -wide * _image.anchorX;
	// 	r = wide + l;
	// 	t = -high * _image.anchorY;
	// 	b = high + t;
	// 	buffer[ 0 ] = buffer[ 4 ] = l;
	// 	buffer[ 1 ] = buffer[ 9 ] = b;
	// 	buffer[ 8 ] = buffer[ 12] = r;
	// 	buffer[ 5 ] = buffer[ 13] = t;
	// }

	// // texture source position
	// // x, b,		2,3
	// // x, y,		6,7
	// // r, b,		10,11
	// // r, y,		14,15
	// buffer[ 2 ] = buffer[ 6 ] = rect.x;
	// buffer[ 3 ] = buffer[ 11] = rect.y + rect.height;
	// buffer[ 10] = buffer[ 14] = rect.x + rect.width;
	// buffer[ 7 ] = buffer[ 15] = rect.y;
};


// used by pbLayer for multiple sprite instances which are not particles
// list objects: { image: pbImage, transform: pbMatrix3, z_order: Number }
pbCanvas.prototype.rawBatchDrawImages = function(_list)
{
	// can't batch in Canvas mode, feed them to drawImageWithTransform one at a time
	var c = _list.length;
	while(c--)
	{
		var s = _list[c];
		this.drawImageWithTransform(s.image, s.transform, s.z_order);
	}
};


// used by pbLayer for multiple sprite instances which have the particle flag set
pbCanvas.prototype.blitDrawImages = function(_list, _surface)
{
	// can't batch in Canvas mode, feed them to drawImageWithTransform one at a time
	var c = _list.length;
	while(c--)
	{
		var s = _list[c];
		this.drawImageWithTransform(s.image, s.transform, s.z_order);
	}
};


pbCanvas.prototype.batchDrawImages = function(_list, _surface)
{
	alert("ERROR: Canvas graphic mode does not yet extend batchDrawImages from pbBaseGraphics!");
};


pbCanvas.prototype.reset = function()
{
	alert("ERROR: Canvas graphic mode does not yet extend reset from pbBaseGraphics!");
};


pbCanvas.prototype.scissor = function(_x, _y, _width, _height)
{
	// TODO: can Canvas handle AABB clipping?  Ignoring this initially but will need to either support it or throw an error/warning.
};


pbCanvas.prototype.fillStyle = function(_fillColor, _lineColor)
{
	alert("ERROR: Canvas graphic mode does not fillStyle scissor from pbBaseGraphics!");
};


pbCanvas.prototype.fillRect = function( x, y, wide, high, color )
{
	alert("ERROR: Canvas graphic mode does not yet extend fillRect from pbBaseGraphics!");
};


pbCanvas.prototype.blitSimpleDrawImages = function( _list, _listLength, _surface )
{
	alert("ERROR: Canvas graphic mode does not yet extend blitSimpleDrawImages from pbBaseGraphics!");
};


pbCanvas.prototype.blitListDirect = function( _list, _listLength, _surface )
{
	alert("ERROR: Canvas graphic mode does not yet extend blitListDirect from pbBaseGraphics!");
};


pbCanvas.prototype.blitDrawImagesPoint = function( _list, _listLength, _surface )
{
	alert("ERROR: Canvas graphic mode does not yet extend blitDrawImagesPoint from pbBaseGraphics!");
};


pbCanvas.prototype.blitDrawImagesPointAnim = function( _list, _listLength, _surface )
{
	alert("ERROR: Canvas graphic mode does not yet extend blitDrawImagesPointAnim from pbBaseGraphics!");
};


pbCanvas.prototype.drawCanvasWithTransform = function( _canvas, _dirty, _transform, _z )
{
	alert("ERROR: Canvas graphic mode does not yet extend drawCanvasWithTransform from pbBaseGraphics!");
};


