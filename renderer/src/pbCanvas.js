/**
 *
 * pbCanvas - wrapper for all Canvas drawing function
 * Must extend pbBaseGraphics.js
 * http://stackoverflow.com/questions/3710275/does-javascript-have-the-interface-type-such-as-javas-interface
 * (I know JS doesn't support interfaces... but it's easier to talk about that way than constant 'duck' references!)
 * 
 */

function pbCanvas()
{

}


// pbCanvas extends from the pbBaseGraphics prototype chain
pbCanvas.prototype = new pbBaseGraphics();
// create property to store the class' parent
pbCanvas.prototype.__super__ = pbBaseGraphics;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript


pbCanvas.prototype.preRender = function()
{
};


pbCanvas.prototype.drawImage = function(x, y, z, _surface, cell, angle, scale)
{
};


pbCanvas.prototype.drawImageWithTransform = function(_image, _transform, _z_order)
{
};


pbCanvas.prototype.batchDrawImages = function(list, _surface)
{
};


pbCanvas.prototype.rawBatchDrawImages = function(list)
{
};


pbCanvas.prototype.reset = function()
{
};

