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
	this.cellsWide = 0;
	this.cellsHigh = 0;
	this.imageData = null;
	this.cellTextureBounds = null;
	this.cellSourceSize = null;
	this.isNPOT = false;

	this.rttTexture = null;
	this.rttTextureRegister = -1;
}


/**
 * createSingle - create a surface to contain a single sprite image
 *
 * @param  {[type]} _imageData          [description]
 * @param  {[type]} _rttTexture         [description]
 * @param  {[type]} _rttTextureRegister [description]
 *
 * @return {[type]}                     [description]
 */
pbSurface.prototype.createSingle = function(_imageData, _rttTexture, _rttTextureRegister)
{
	if (_rttTexture === undefined) _rttTexture = null;
	if (_rttTextureRegister === undefined) _rttTextureRegister = 0;

	this.cellsWide = this.cellsHigh = 1;

	this.cellSourceSize = [];
	if (_rttTexture)
	{
		this.cellSourceSize[0] = { wide:_rttTexture.width, high:_rttTexture.height };
	}
	else if (_imageData)
	{
		this.cellSourceSize[0] = { wide:_imageData.width, high:_imageData.height };
	}
	this.isNPOT = !(is_power_of_2(this.cellSourceSize[0].wide) && is_power_of_2(this.cellSourceSize[0].high));

	console.log("pbSurface.createSingle " + this.cellSourceSize[0].wide +  "x" + this.cellSourceSize[0].high + " isNPOT = " + (this.isNPOT ? "true" : "false"));

	this.rttTexture = _rttTexture;
	this.rttTextureRegister = _rttTextureRegister;
	this.imageData = _imageData;
	
	this.cellTextureBounds = [];
	this.cellTextureBounds[0] = new pbRectangle(0, 0, 1, 1);
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
	
	this.cellsWide = _numWide;
	this.cellsHigh = _numHigh;

	this.rttTexture = _rttTexture;
	this.rttTextureRegister = _rttTextureRegister;
	this.imageData = _imageData;
	
	console.log("pbSurface.create " + srcWide +  "x" + srcHigh + " " + this.cellsWide + "x" + this.cellsHigh + " isNPOT = " + (this.isNPOT ? "true" : "false"));

	// dimensions of one cell in texture coordinates (0 = left/top, 1 = right/bottom)
	var texWide, texHigh;
	if (_imageData)
	{
		texWide = 1.0 / (srcWide / _wide);
		texHigh = 1.0 / (srcHigh / _high);
	}
	else
	{
		// there is no image attached, create a surface to exactly fit the animation cells
		texWide = 1.0 / this.cellsWide;
		texHigh = 1.0 / this.cellsHigh;
	}

	this.cellSourceSize = [];
	this.cellTextureBounds = [];
	var i = 0;
	for(var y = 0; y < this.cellsHigh; y++)
	{
		for(var x = 0; x < this.cellsWide; x++)
		{
			this.cellSourceSize[i] = { wide: _wide, high: _high };
			this.cellTextureBounds[i++] = new pbRectangle(x * texWide, y * texHigh, texWide, texHigh);
		}
	}
};


/**
 * createAtlas - create a surface and specify the cell positions using a JSON data structure
 * I have tested this on the dragon_atlas.json file used in Phaser previously, which was
 * created with TexturePacker.
 *
 * @param  {[type]} _JSON               [description]
 * @param  {[type]} _imageData          [description]
 */
pbSurface.prototype.createAtlas = function(_JSON, _imageData)
{
    var data = JSON.parse(_JSON);
    var w = data.meta.size.w;
    var h = data.meta.size.h;
	this.isNPOT = !(is_power_of_2(w) && is_power_of_2(h));

	console.log("pbSurface.createAtlas " + w + "x" + h + " frames = " + data.frames.length + " isNPOT = " + (this.isNPOT ? "true" : "false"));

	this.imageData = _imageData;
	this.cellTextureBounds = [];
	this.cellSourceSize = [];
	for(var i = 0, l = data.frames.length; i < l; i++)
	{
		var f = data.frames[i];
		this.cellSourceSize[i] = { wide: f.sourceSize.w, high: f.sourceSize.h };
		this.cellTextureBounds[i] = new pbRectangle(f.frame.x / w, f.frame.y / h, f.frame.w / w, f.frame.h / h);
	}
};


pbSurface.prototype.destroy = function()
{
	this.imageData = null;
	this.cellSourceSize = null;
	this.cellTextureBounds = null;
};


function is_power_of_2(x)
{
    return ((x > 0) && !(x & (x - 1)));
}
