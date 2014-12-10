/**
 *
 * pbRenderer - initialise the rendering system, provide access to drawing sub-systems
 * 
 */


var canvas = null;
var ctx = null;
var webGl = null;
var renderer = "canvas";
var stats = null;


// TODO: split RAF timer out of here and into it's own object, including updateCallback etc
 
function pbRenderer(docId, updateCallback, updateContext)
{
	console.log("pbRenderer c'tor entry");

	// parameters
	this.docId = docId;
	this.updateCallback = updateCallback;
	this.updateContext = updateContext;

	// globals
 	webGl = null;

 	// fps counter
 	stats = new Stats();
 	stats.setMode(0);
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.right = '0px';
	stats.domElement.style.bottom = '0px';

	document.body.appendChild( stats.domElement );

	// members
	this.isBooted = false;
	this.rootTimer = null;
	this.frameCount = 0;

	// drawing sub-systems
	this.graphics = null;

	// boot callback
	var _this = this;
    this._onBoot = function () {
        	return _this.boot();
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


pbRenderer.prototype.boot = function()
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

    document.removeEventListener('DOMContentLoaded', this._onBoot);
    window.removeEventListener('load', this._onBoot);

    // only boot once
    this.isBooted = true;

    // get the canvas and context globals
	this.setCanvas();

    // start the update looping
	this.rootTimer = new pbRootTimer();
	this.rootTimer.start(this.update, this);

	// create the drawing sub-systems
    this.graphics = new pbGraphics();
};


pbRenderer.prototype.setCanvas = function()
{
	console.log( "pbRenderer.setCanvas" );
	// default renderer mode is 'canvas'
	renderer = "canvas";

	// set the global canvas variable
	canvas = document.getElementById(this.docId);

	this.width = canvas.width;
	this.height = canvas.height;
	
	// try to get a webGL context, revert to canvas '2d' only if webGl is not available
	webGl = new pbWebGl();
	ctx = webGl.initGL(canvas);
	if (!ctx)
	{
	 	ctx = canvas.getContext("2d");
		webGl = null;
	}
	else
	{
	 	renderer = "webgl";
	}
};


pbRenderer.prototype.update = function()
{
	stats.begin();

	this.frameCount++;

	if (renderer === "webgl")
	  	webGl.preRender();

	this.updateCallback.call(this.updateContext);

	stats.end();
};


