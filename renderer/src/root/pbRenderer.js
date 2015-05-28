/**
 *
 * pbRenderer - initialise the rendering system, callback when ready, and provide the main update tick callback
 * 
 */



function pbRenderer( _parent )
{
	console.log("pbRenderer c'tor");

	// parameters
	this.parent = _parent;
	this.useFramebuffer = null;
	this.useRenderbuffer = null;
	this.preUpdate = null;
	this.postUpdate = null;
	this.canvas = null;

	// drawing system
	this.graphics = null;
}


pbRenderer.prototype.destroy = function( )
{
	console.log("pbRenderer.destroy");

	if (this.graphics)
		this.graphics.destroy();
	this.graphics = null;

	this.updateCallback = null;
	this.gameContext = null;
	this.bootCallback = null;
};


/**
 * create - set the graphics mode (any extension of pbBaseGraphics)
 *
 * @param  {String} _preferredRenderer - 'webgl', 'canvas' or undefined.  undefined will try webGl and fall-back to canvas if it fails.
 *
 * TODO: expand for other graphics mode, ie. DOM sprites: http://buildnewgames.com/dom-sprites/
 */
pbRenderer.prototype.create = function( _preferredRenderer, _canvas )
{
	console.log("pbRenderer.create");

	this.canvas = _canvas;
	// reset the canvas (erase its contents and set all properties to defaults)
	this.canvas.width = this.canvas.width;

	// useful stuff held local to renderer
	pbRenderer.width = this.canvas.width;
	pbRenderer.height = this.canvas.height;
	this.graphics = null;
	
	//
	// try to get the renderer set up
	// TODO: all drawing modes should be tried in a predetermined order with optional preference respected
	// currently: 'webgl', 'canvas'
	//

	useRenderer = 'none';
	if (_preferredRenderer === undefined || _preferredRenderer == 'webgl')
	{
		// try to get a webGL context
		this.graphics = new pbWebGl();
		if (this.graphics.create(this.canvas))
		{
			// got one, now set up the support
			useRenderer = 'webgl';
			layerClass = pbWebGlLayer;
			imageClass = pbWebGlImage;
			pbMatrix3.rotationDirection = 1;
			return;
		}
		this.graphics.destroy();
		this.graphics = null;
	}

	if (!this.graphics)
	{
		// final case fallback, try canvas '2d'
		this.graphics = new pbCanvas();
		if (this.graphics.create(this.canvas))
		{
			// got one, now set up the support
			useRenderer = 'canvas';
			layerClass = pbCanvasLayer;
			imageClass = pbCanvasImage;
			pbMatrix3.rotationDirection = -1;
			return;
		}
		this.graphics.destroy();
		this.graphics = null;
	}
};


pbRenderer.prototype.update = function( _callback, _context )
{
	stats.begin();

	pbRenderer.frameCount++;

	// prepare to draw (erase screen)
	this.graphics.preRender( pbRenderer.width, pbRenderer.height, this.useFramebuffer, this.useRenderbuffer );
	
	// update game logic
	_callback.call( _context );

	// update all object transforms then draw everything
	if ( rootLayer )
	{
		// the rootLayer update will iterate the entire display list
		rootLayer.update();
	}

	// postUpdate if required
	if ( this.postUpdate !== null )
	{
		this.postUpdate.call(this.gameContext);
	}

	stats.end();
};


