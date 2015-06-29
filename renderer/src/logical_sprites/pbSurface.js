/**
 *
 * A raw texture surface with handling and manipulation methods.
 * TODO: Currently holds the HTML Image only but should be extended to any other image sources.
 * 
 * Each surface may contain a number of separate images, called 'cells' here because they will often be animation cells.
 * Surfaces will be sent entire to graphics card in WebGL mode, the shaders use the cell data to pick out the correct frame.
 * 
 */


function pbSurface()
{
	this.cellWide = 0;
	this.cellHigh = 0;
	this.cellsWide = 0;
	this.cellsHigh = 0;
	this.imageData = null;
	this.cellTextureBounds = null;
	this.isNPOT = false;

	this.rttTexture = null;
	this.rttTextureRegister = -1;
}


pbSurface.prototype.createSingle = function(_wide, _high, _imageData, _rttTexture, _rttTextureRegister)
{
	if (_rttTexture === undefined) _rttTexture = null;
	if (_rttTextureRegister === undefined) _rttTextureRegister = 0;

	var srcWide, srcHigh;
	if (_rttTexture)
	{
		srcWide = _rttTexture.width;
		srcHigh = _rttTexture.height;
	}
	else if (_imageData)
	{
		srcWide = _imageData.width;
		srcHigh = _imageData.height;
	}
	this.isNPOT = !(is_power_of_2(srcWide) && is_power_of_2(srcHigh));

	if (_wide === 0) _wide = srcWide;
	if (_high === 0) _high = srcHigh;
	
	this.cellWide = _wide;
	this.cellHigh = _high;
	this.cellsWide = this.cellsHigh = 1;

	this.rttTexture = _rttTexture;
	this.rttTextureRegister = _rttTextureRegister;
	this.imageData = _imageData;
	
	console.log("pbSurface.createSingle " + this.cellWide +  "x" + this.cellHigh + " isNPOT = " + (this.isNPOT ? "true" : "false"));

	// dimensions of one cell in texture coordinates (0 = left/top, 1 = right/bottom)
	var texWide, texHigh;
	if (_imageData)
	{
		// _image may have padding around the animation cells
		texWide = 1.0 / (srcWide / this.cellWide);
		texHigh = 1.0 / (srcHigh / this.cellHigh);
	}
	else
	{
		// there is no image attached, create a surface to exactly fit the animation cell
		texWide = 1.0;
		texHigh = 1.0;
	}

	this.cellTextureBounds = [];
	this.cellTextureBounds[0] = new pbRectangle(0, 0, texWide, texHigh);
};


pbSurface.prototype.createGrid = function(_wide, _high, _numWide, _numHigh, _imageData, _rttTexture, _rttTextureRegister)
{
	if (_rttTexture === undefined) _rttTexture = null;
	if (_rttTextureRegister === undefined) _rttTextureRegister = 0;

	var srcWide, srcHigh;
	if (_rttTexture)
	{
		srcWide = _rttTexture.width;
		srcHigh = _rttTexture.height;
	}
	else if (_imageData)
	{
		srcWide = _imageData.width;
		srcHigh = _imageData.height;
	}
	this.isNPOT = !(is_power_of_2(srcWide) && is_power_of_2(srcHigh));

	if (_wide === 0) _wide = srcWide;
	if (_high === 0) _high = srcHigh;
	
	this.cellWide = _wide;
	this.cellHigh = _high;
	this.cellsWide = _numWide;
	this.cellsHigh = _numHigh;

	this.rttTexture = _rttTexture;
	this.rttTextureRegister = _rttTextureRegister;
	this.imageData = _imageData;
	
	console.log("pbSurface.create " + this.cellWide +  "x" + this.cellHigh + " " + this.cellsWide + "x" + this.cellsHigh + " isNPOT = " + (this.isNPOT ? "true" : "false"));

	// dimensions of one cell in texture coordinates (0 = left/top, 1 = right/bottom)
	var texWide, texHigh;
	if (_imageData)
	{
		// _image may have padding around the animation cells
		texWide = 1.0 / (srcWide / this.cellWide);
		texHigh = 1.0 / (srcHigh / this.cellHigh);
	}
	else
	{
		// there is no image attached, create a surface to exactly fit the animation cells
		texWide = 1.0 / this.cellsWide;
		texHigh = 1.0 / this.cellsHigh;
	}

	this.cellTextureBounds = [];
	var i = 0;
	for(var y = 0; y < this.cellsHigh; y++)
		for(var x = 0; x < this.cellsWide; x++)
			this.cellTextureBounds[i++] = new pbRectangle(x * texWide, y * texHigh, texWide, texHigh);
};


pbSurface.prototype.createJSON = function(_wide, _high, _JSON, _imageData, _rttTexture, _rttTextureRegister)
{

};


pbSurface.prototype.destroy = function()
{
	this.imageData = null;
	this.cellTextureBounds = null;
};


function is_power_of_2(x)
{
    return ((x > 0) && !(x & (x - 1)));
}
