/**
 *
 * pbRenderer - initialise the rendering system, callback when ready, and provide the main update tick callback
 * 
 */


var canvas = null;
var webGl = null;
var rootLayer = null;


// TODO: split RAF timer out of here and into it's own object, including updateCallback etc???

function pbRenderer(_renderMode, _docId, _bootCallback, _updateCallback, _context)
{
	console.log("pbRenderer c'tor entry");

	// parameters
	this.docId = _docId;
	this.bootCallback = _bootCallback;
	this.updateCallback = _updateCallback;
	this.context = _context;

	// globals
 	canvas = null;
 	webGl = null;
 	rootLayer = null;

	// members
	this.isBooted = false;
	this.rootTimer = null;
	this.frameCount = 0;

	// drawing system
	this.graphics = null;

	// boot callback
	var _this = this;
    this._onBoot = function () {
        	return _this.boot(_renderMode);
    	};
    if (document.readyState === 'complete' || document.readyState === 'interactive')
    {
        window.setTimeout(this._onBoot, 0);
    }
    else
    {
        document.addEventListener('DOMContentLoaded', this._onBoot, false);
        window.addEventListener('load', this._onBoot, false);
    }

	console.log("pbRenderer c'tor exit");
}


pbRenderer.prototype.destroy = function()
{
	if (this.rootTimer)
		this.rootTimer.destroy();
	this.rootTimer = null;

	if (this.graphics)
		this.graphics.destroy();
	this.graphics = null;

	if (rootLayer)
		rootLayer.destroy();
	rootLayer = null;

	this.updateCallback = null;
	this.bootCallback = null;
	this.context = null;

	canvas = null;
	webGl = null;
};


pbRenderer.prototype.boot = function(_renderMode)
{
    if (this.isBooted)
    {
    	// only boot once
        return;
    }

    if (!document.body)
    {
    	// wait until the document.body is available, keep trying every 20 ms
        window.setTimeout(this._onBoot, 20);
        return;
    }

   	console.log("pbRenderer boot");

    document.removeEventListener('DOMContentLoaded', this._onBoot);
    window.removeEventListener('load', this._onBoot);

    // only boot once
    this.isBooted = true;

	// create the drawing system interface
	this.createGraphics(_renderMode);

	// create the rootLayer container for all graphics
	rootLayer = new pbLayer();
	rootLayer.create(null, this, 0, 0, 0, 0, 1, 1);

    // call the boot callback now the renderer is ready
    this.bootCallback.call(this.context);

    // start the update looping
	this.rootTimer = new pbRootTimer();
	this.rootTimer.start(this.update, this);
};


/**
 * createGraphics - set the graphics mode (any extension of pbBaseGraphics)
 *
 * @param  {String} _preferredRenderer - 'webgl', 'canvas' or undefined.  undefined will try webGl and fall-back to canvas if it fails.
 *
 * TODO: expand for other graphics mode, ie. DOM sprites: http://buildnewgames.com/dom-sprites/
 */
pbRenderer.prototype.createGraphics = function(_preferredRenderer)
{
	// set the global canvas variable
	canvas = document.getElementById(this.docId);

	this.width = canvas.width;
	this.height = canvas.height;
	this.graphics = null;
	
	if (_preferredRenderer === undefined || _preferredRenderer == 'webgl')
	{
		// try to get a webGL context
		this.graphics = new pbWebGl();
		if (!this.graphics.create(canvas))
		{
			this.graphics.destroy();
			this.graphics = null;
		}
	}

	if (!this.graphics)
	{
		// final case fallback, try canvas '2d'
		this.graphics = new pbCanvas();
		if (!this.graphics.create(canvas))
		{
			this.graphics.destroy();
			this.graphics = null;
		}
	}
};


pbRenderer.prototype.update = function()
{
	stats.begin();

	this.frameCount++;

	// prepare to draw (erase screen)
	this.graphics.preRender();

	// update game logic
	this.updateCallback.call(this.context);

	// update all object transforms then draw everything
	if (rootLayer)
	{
		// the rootLayer update will iterate the entire display list
		rootLayer.update();
	}

	stats.end();
};


