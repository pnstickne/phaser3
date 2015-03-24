/**
 *
 * A filter demo for the new Phaser 3 renderer.
 *
 */



// created while the data is loading (preloader)
function pbFilterDemo( docId )
{
	console.log( "pbFilterDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.firstTime = true;
	this.surface = null;
	this.srcImage = null;
	this.renderSurface = null;
	this.displayLayer = null;
	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;
	this.filterTexture = null;
	this.redScale = 1.0;
	this.greenScale = 1.0;
	this.blueScale = 1.0;

	// dat.GUI controlled variables and callbacks
	this.redCtrl = gui.add(this, "redScale").min(0.0).max(2.0).step(0.1).listen();
	this.redCtrl.onFinishChange(function(value) { if (!value) _this.redScale = 0; });
	this.grnCtrl = gui.add(this, "greenScale").min(0.0).max(2.0).step(0.1).listen();
	this.grnCtrl.onFinishChange(function(value) { if (!value) _this.greenScale = 0; });
	this.bluCtrl = gui.add(this, "blueScale").min(0.0).max(2.0).step(0.1).listen();
	this.bluCtrl.onFinishChange(function(value) { if (!value) _this.blueScale = 0; });

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/screen1.jpg" );

	console.log( "pbFilterDemo c'tor exit" );
}


pbFilterDemo.prototype.allLoaded = function()
{
	console.log( "pbFilterDemo.allLoaded" );

	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbFilterDemo.prototype.create = function()
{
	console.log("pbFilterDemo.create");

	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	// _wide, _high, _numWide, _numHigh, _image
	this.surface.create(0, 0, 1, 1, image);

	this.srcImage = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	this.srcImage.create(this.surface, 0, 0, 0);
};


pbFilterDemo.prototype.destroy = function()
{
	console.log("pbFilterDemo.destroy");

	gui.remove(this.redCtrl);
	gui.remove(this.grnCtrl);
	gui.remove(this.bluCtrl);

	if (this.surface)
		this.surface.destroy();
	this.surface = null;

	if (this.image)
		this.image.destroy();
	this.image = null;

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
	this.filterTexture = null;
};


pbFilterDemo.prototype.restart = function()
{
	console.log("pbFilterDemo.restart");
	
	this.destroy();
	this.create();
};




// create an empty texture to draw to
pbFilterDemo.prototype.initTexture = function(_textureRegister, _width, _height)
{
	var texture = gl.createTexture();
    texture.width = _width;
    texture.height = _height;
    gl.activeTexture(_textureRegister);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	return texture;
};


// create a 'render-to' depth buffer matching the _texture dimensions
pbFilterDemo.prototype.initDepth = function(_texture)
{
    var depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _texture.width, _texture.height);
    return depth;
};


// attach _texture and _depth to a framebuffer
pbFilterDemo.prototype.initFramebuffer = function(_texture, _depth)
{
    // attach the render-to-texture to a new framebuffer
	var fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, _texture, 0);
    // attach the depth buffer to the framebuffer
    if (_depth)
    	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, _depth);

    return fb;
};


// draw _image using _transform, use the _fb framebuffer texture and depth buffers
pbFilterDemo.prototype.drawSceneToTexture = function(_fb, _image, _transform)
{
	// bind the framebuffer so drawing will go to the associated texture and depth buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);
	// draw this.srcImage into the render-to-texture
	this.renderer.graphics.drawImageWithTransform(_image, _transform, 1.0);
};


pbFilterDemo.prototype.update = function()
{
	// one-time initialisation
	if (this.firstTime)
	{
		// create the render-to-texture, depth buffer, and a frame buffer to hold them
		this.rttTexture = this.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
		this.rttRenderbuffer = this.initDepth(this.rttTexture);
		this.rttFramebuffer = this.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

		// create the filter texture
		this.filterTexture = this.initTexture(gl.TEXTURE1, pbRenderer.width, pbRenderer.height);
		this.filterFramebuffer = this.initFramebuffer(this.filterTexture, null);

		// set the transformation for rendering to the render-to-texture
		this.srcTransform = pbMatrix3.makeTransform(0, 0, 0, 1, 1);

	    // clear the gl bindings
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	    gl.bindTexture(gl.TEXTURE_2D, null);
	    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// don't do this again...
		this.firstTime = false;
	}

	// draw srcImage using the render-to-texture framebuffer
	this.drawSceneToTexture(this.rttFramebuffer, this.srcImage, this.srcTransform);

	// copy rttTexture to the filterFramebuffer attached texture, applying a filter as it draws
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	this.renderer.graphics.applyFilterToTexture(0, this.rttTexture, this.setTint, this);

	// draw the filter texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(this.filterTexture);
};


// callback required to set the correct filter program and it's associated attributes and/or uniforms
pbFilterDemo.prototype.setTint = function(_filters)
{
   	// set the filter program
	_filters.setProgram(_filters.tintFilterProgram);
	// set the tint values in the filter shader program
	gl.uniform1f( pbWebGlShaders.currentProgram.uRedScale, this.redScale );
	gl.uniform1f( pbWebGlShaders.currentProgram.uGreenScale, this.greenScale );
	gl.uniform1f( pbWebGlShaders.currentProgram.uBlueScale, this.blueScale );
};

