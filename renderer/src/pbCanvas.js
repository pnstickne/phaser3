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

}


// pbCanvas extends from the pbBaseGraphics prototype chain
pbCanvas.prototype = new pbCanvas();
// create property to store the class' parent
pbCanvas.prototype.__super__ = pbCanvas;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript



pbCanvas.prototype.preRender = function()
{
	alert("ERROR: Canvas graphic mode does not yet extend preRender from pbBaseGraphics!");
};

pbCanvas.prototype.drawImage = function(_x, _y, _z, _surface, _cellFrame, _angle, _scale)
{
	alert("ERROR: Canvas graphic mode does not yet extend drawImage from pbBaseGraphics!");
};

pbCanvas.prototype.drawImageWithTransform = function(_image, _transform, _z_order)
{
	alert("ERROR: Canvas graphic mode does not yet extend drawImageWithTransform from pbBaseGraphics!");
};

pbCanvas.prototype.blitDrawImages = function(_list, _surface)
{
	alert("ERROR: Canvas graphic mode does not yet extend blitDrawImages from pbBaseGraphics!");
};

pbCanvas.prototype.batchDrawImages = function(_list, _surface)
{
	alert("ERROR: Canvas graphic mode does not yet extend batchDrawImages from pbBaseGraphics!");
};

pbCanvas.prototype.rawBatchDrawImages = function(_list)
{
	alert("ERROR: Canvas graphic mode does not yet extend rawBatchDrawImages from pbBaseGraphics!");
};

pbCanvas.prototype.reset = function()
{
	alert("ERROR: Canvas graphic mode does not yet extend reset from pbBaseGraphics!");
};

pbCanvas.prototype.scissor = function(_x, _y, _width, _height)
{
	alert("ERROR: Canvas graphic mode does not yet extend scissor from pbBaseGraphics!");
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

