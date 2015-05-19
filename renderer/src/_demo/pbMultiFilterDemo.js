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
	this.tintShaderJSON = this.loader.loadFile( "../JSON/tintShaderSources.json" );
	this.waveShaderJSON = this.loader.loadFile( "../JSON/waveShaderSources.json" );
	this.spriteImg = this.loader.loadImage( "image", "../img/screen1.jpg" );

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

	// add the shaders
	var jsonString = this.loader.getFile( this.tintShaderJSON ).responseText;
	this.tintShaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );
	jsonString = this.loader.getFile( this.waveShaderJSON ).responseText;
	this.waveShaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );

	var imageData = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	// _wide, _high, _numWide, _numHigh, _image
	this.surface.create(0, 0, 1, 1, imageData);

	this.srcImage = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	this.srcImage.create(this.surface, 0, 0, 0);


	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTextureNumber = 2;
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// create the filter texture
	this.filterTextureNumber = 0;
	this.filterTexture = pbWebGlTextures.initTexture(this.filterTextureNumber, pbRenderer.width, pbRenderer.height);
	this.filterFramebuffer = pbWebGlTextures.initFramebuffer(this.filterTexture, null);

	// create the 2nd filter texture
	this.filter2TextureNumber = 1;
	this.filter2Texture = pbWebGlTextures.initTexture(this.filter2TextureNumber, pbRenderer.width, pbRenderer.height);
	this.filter2Framebuffer = pbWebGlTextures.initFramebuffer(this.filter2Texture, null);

	// set the transformation for rendering to the render-to-texture
	this.srcTransform = pbMatrix3.makeTransform(0, 0, 0, 1, 1);

    // clear the gl bindings
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
	this.filterTexture = null;
	this.filterFramebuffer = null;
	this.filter2Texture = null;
	this.filter2Framebuffer = null;
};


pbMultiFilterDemo.prototype.restart = function()
{
	console.log("pbMultiFilterDemo.restart");
	
	this.destroy();
	this.create();
};



pbMultiFilterDemo.prototype.update = function()
{
	// draw srcImage using the render-to-texture framebuffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	this.renderer.graphics.drawImageWithTransform(this.rttTextureNumber, this.srcImage, this.srcTransform, 1.0);

	// draw rttTexture to the filterTexture, applying a tint shader (from TEXTURE0, filterTexture is on TEXTURE1)
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	this.renderer.graphics.applyShaderToTexture(this.rttTextureNumber, this.rttTexture, this.setTint, this);

	// draw filterTexture to the rttTexture, applying a wave shader (from TEXTURE1, rttTexture is still on TEXTURE0)
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filter2Framebuffer);
	this.renderer.graphics.applyShaderToTexture(this.filterTextureNumber, this.filterTexture, this.setWave, this);

	// draw the final texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(this.rttTextureNumber, this.filter2Texture);
};


// callback required to set the correct shader program and it's associated attributes and/or uniforms
pbMultiFilterDemo.prototype.setTint = function(_shaders, _textureNumber)
{
   	// set the shader program
	_shaders.setProgram(this.tintShaderProgram, _textureNumber);
	// set the tint values in the shader program
	gl.uniform1f( _shaders.getUniform( "uRedScale" ), this.redScale );
	gl.uniform1f( _shaders.getUniform( "uGreenScale" ), this.greenScale );
	gl.uniform1f( _shaders.getUniform( "uBlueScale" ), this.blueScale );
};


// callback required to set the correct shader program and it's associated attributes and/or uniforms
pbMultiFilterDemo.prototype.setWave = function(_shaders, _textureNumber)
{
   	// set the shader program
	_shaders.setProgram(this.waveShaderProgram, _textureNumber);
	// set the wave offset values in the shader program
	gl.uniform1f( _shaders.getUniform( "uOffsetX" ), (pbRenderer.frameCount % 1000) / 1000.0 );
	gl.uniform1f( _shaders.getUniform( "uOffsetY" ), (pbRenderer.frameCount % 1000) / 1000.0 );
};

