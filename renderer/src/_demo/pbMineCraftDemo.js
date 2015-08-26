/**
 *
 * A filter demo for the new Phaser 3 renderer.
 *
 *
 * 
 */



// created while the data is loading (preloader)
function pbMineCraftDemo( docId )
{
	console.log( "pbMineCraftDemo c'tor entry" );

	this.firstTime = true;
	this.surface = null;
	this.srcImage = null;
	this.renderSurface = null;
	this.displayLayer = null;
	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;
	this.filterTexture = null;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( 'webgl', this.create, this.update, this );
	this.shaderJSON = pbPhaserRender.loader.loadFile( "../json/minecraftShaderSources.json" );
	this.spriteImg = pbPhaserRender.loader.loadImage( "image", "../img/spriteDLight/redBall_shaded_512 - Copy.png" );

	console.log( "pbMineCraftDemo c'tor exit" );
}


pbMineCraftDemo.prototype.create = function()
{
	console.log("pbMineCraftDemo.create");

	// add the shader
	var jsonString = pbPhaserRender.loader.getFile( this.shaderJSON ).responseText;
	this.shaderProgram = pbPhaserRender.renderer.graphics.shaders.addJSON( jsonString );

	var imageData = pbPhaserRender.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	// _imageData, _rttTexture, _rttTextureRegister
	this.surface.createSingle(imageData);

	this.srcImage = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	this.srcImage.create(this.surface, 0, 0, 0);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTextureNumber = 3;
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, pbPhaserRender.width, pbPhaserRender.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// create the filter texture
	this.filterTextureNumber = 1;
	this.filterTexture = pbWebGlTextures.initTexture(this.filterTextureNumber, pbPhaserRender.width, pbPhaserRender.height);
	this.filterFramebuffer = pbWebGlTextures.initFramebuffer(this.filterTexture, null);

	// set the transformation for rendering to the render-to-texture
	this.srcTransform = pbMatrix3.makeTransform(0, 0, 0, 1, 1);

    // clear the gl bindings
    gl.bindTexture(gl.TEXTURE_2D, null);
	pbWebGlTextures.cancelFramebuffer();
};


pbMineCraftDemo.prototype.destroy = function()
{
	console.log("pbMineCraftDemo.destroy");

	gui.remove(this.redCtrl);
	gui.remove(this.grnCtrl);
	gui.remove(this.bluCtrl);

	if (this.surface)
		this.surface.destroy();
	this.surface = null;

	if (this.phaserRender)
		this.phaserRender.destroy();
	this.phaserRender = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
	this.filterTexture = null;
};


pbMineCraftDemo.prototype.restart = function()
{
	console.log("pbMineCraftDemo.restart");
	
	this.destroy();
	this.create();
};


pbMineCraftDemo.prototype.update = function()
{
	// draw srcImage using the render-to-texture framebuffer
	// bind the framebuffer so drawing will go to the associated texture and depth buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	// draw this.srcImage into the render-to-texture
	pbPhaserRender.renderer.graphics.drawImageWithTransform(this.rttTextureNumber, this.srcImage, this.srcTransform, 1.0);

	// copy rttTexture to the filterFramebuffer attached texture, applying a filter as it draws
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	pbPhaserRender.renderer.graphics.applyShaderToTexture( this.rttTexture, this.setTint, this );

	// draw the filter texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	pbPhaserRender.renderer.graphics.drawTextureToDisplay( this.filterTexture );
};


// callback required to set the correct shader program and it's associated attributes and/or uniforms
pbMineCraftDemo.prototype.setTint = function(_shaders)
{
   	// set the shader program
	_shaders.setProgram(this.shaderProgram, this.rttTextureNumber);
	// set the tint values in the shader program
	gl.uniform1f( _shaders.getUniform( "uGlobalTime"), pbPhaserRender.frameCount * 0.02 );
};

