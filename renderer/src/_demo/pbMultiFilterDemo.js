/**
 *
 * A multiple filter demo for the new Phaser 3 renderer.
 *
 */



// created while the data is loading (preloader)
function pbMultiFilterDemo( docId )
{
	console.log( "pbMultiFilterDemo c'tor entry" );

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

	console.log( "pbMultiFilterDemo c'tor exit" );
}


pbMultiFilterDemo.prototype.allLoaded = function()
{
	console.log( "pbMultiFilterDemo.allLoaded" );

	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbMultiFilterDemo.prototype.create = function()
{
	console.log("pbMultiFilterDemo.create");

	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	// _wide, _high, _numWide, _numHigh, _image
	this.surface.create(0, 0, 1, 1, image);

	this.srcImage = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	this.srcImage.create(this.surface, 0, 0, 0);
};


pbMultiFilterDemo.prototype.destroy = function()
{
	console.log("pbMultiFilterDemo.destroy");

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


pbMultiFilterDemo.prototype.restart = function()
{
	console.log("pbMultiFilterDemo.restart");
	
	this.destroy();
	this.create();
};




// draw _image using _transform, use the _fb framebuffer texture and depth buffers
pbMultiFilterDemo.prototype.drawSceneToTexture = function(_fb, _image, _transform)
{
	// bind the framebuffer so drawing will go to the associated texture and depth buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);
	// draw this.srcImage into the render-to-texture
	this.renderer.graphics.drawImageWithTransform(_image, _transform, 1.0);
};


pbMultiFilterDemo.prototype.update = function()
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

	// copy rttTexture to the filterFramebuffer attached texture, applying a tint filter as it draws
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	this.renderer.graphics.applyFilterToTexture(0, this.rttTexture, this.setTint, this);

	// copy filterTexture back to the rttFramebuffer attached texture, applying a wave filter as it draws
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	this.renderer.graphics.applyFilterToTexture(1, this.rttTexture, this.setWave, this);

	// draw the final texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(0, this.filterTexture);
};


// callback required to set the correct filter program and it's associated attributes and/or uniforms
pbMultiFilterDemo.prototype.setTint = function(_filters, _textureNumber)
{
   	// set the filter program
	_filters.setProgram(_filters.tintFilterProgram, _textureNumber);
	// set the tint values in the filter shader program
	gl.uniform1f( pbWebGlShaders.currentProgram.uniforms.uRedScale, this.redScale );
	gl.uniform1f( pbWebGlShaders.currentProgram.uniforms.uGreenScale, this.greenScale );
	gl.uniform1f( pbWebGlShaders.currentProgram.uniforms.uBlueScale, this.blueScale );
};


// callback required to set the correct filter program and it's associated attributes and/or uniforms
pbMultiFilterDemo.prototype.setWave = function(_filters, _textureNumber)
{
   	// set the filter program
	_filters.setProgram(_filters.waveFilterProgram, _textureNumber);
	// set the wave offset values in the filter shader program
	gl.uniform1f( pbWebGlShaders.currentProgram.uniforms.uOffsetX, (pbRenderer.frameCount % 1000) / 1000.0 );
	gl.uniform1f( pbWebGlShaders.currentProgram.uniforms.uOffsetY, (pbRenderer.frameCount % 1000) / 1000.0 );
};

