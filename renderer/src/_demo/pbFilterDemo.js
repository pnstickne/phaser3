/**
 *
 * A filter demo for the new Phaser 3 renderer.
 *
 *
 * TODO: extend this and pbWebGl support functions to allow 'ping-pong' filtering...
 * eg.
 * texture0 = raw image -> texture1 apply tint filter
 * texture1 = tinted image -> texture0 apply warp filter
 * etc
 * finally, render from texture 0 or 1 to display
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
	this.tintShaderJSON = this.loader.loadFile( "../JSON/tintShaderSources.json" );
	this.spriteImg = this.loader.loadImage( "image", "../img/screen1.jpg" );

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

	// add the shader
	var jsonString = this.loader.getFile( this.tintShaderJSON ).responseText;
	this.tintShaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );

	var imageData = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	// _wide, _high, _numWide, _numHigh, _image
	this.surface.create(0, 0, 1, 1, imageData);

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
		this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
		this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
		this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

		// create the filter texture
		this.filterTexture = pbWebGlTextures.initTexture(gl.TEXTURE1, pbRenderer.width, pbRenderer.height);
		this.filterFramebuffer = pbWebGlTextures.initFramebuffer(this.filterTexture, null);

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
	this.renderer.graphics.applyShaderToTexture(0, this.rttTexture, this.setTint, this);

	// draw the filter texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(0, this.filterTexture);
};


// callback required to set the correct shader program and it's associated attributes and/or uniforms
pbFilterDemo.prototype.setTint = function(_shaders)
{
   	// set the shader program
	_shaders.setProgram(this.tintShaderProgram, 0);
	// set the tint values in the shader program
	gl.uniform1f( _shaders.getUniform( "uRedScale" ), this.redScale );
	gl.uniform1f( _shaders.getUniform( "uGreenScale" ), this.greenScale );
	gl.uniform1f( _shaders.getUniform( "uBlueScale" ), this.blueScale );
};

