/**
 *
 * Empty demo file, loads a texture and sets up the renderer to display with a user defined shader...
 *
 */



// created while the data is loading (preloader)
function pbBlankShaderDemo( docId )
{
	console.log( "pbBlankShaderDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.shaderJSON = this.loader.loadFile( "../JSON/tintShaderSources.json" );
	this.loader.loadImage( "ball", "../img/sphere3.png" );

	console.log( "pbBlankShaderDemo c'tor exit" );
}


pbBlankShaderDemo.prototype.allLoaded = function()
{
	console.log( "pbBlankShaderDemo.allLoaded" );

	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbBlankShaderDemo.prototype.create = function()
{
	console.log("pbBlankShaderDemo.create");

	// add the shader
	var jsonString = this.loader.getFile( this.shaderJSON ).responseText;
	this.shaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );

	// create a render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// create the filter destination texture
	this.filterTexture = pbWebGlTextures.initTexture(gl.TEXTURE1, pbRenderer.width, pbRenderer.height);
	this.filterFramebuffer = pbWebGlTextures.initFramebuffer(this.filterTexture, null);

	// set the frame buffer to be used as the destination during the draw phase of renderer.update (drawing the invaders)
   	this.renderer.useFramebuffer = this.rttFramebuffer;
   	this.renderer.useRenderbuffer = this.rttRenderbuffer;

	// set up the renderer postUpdate callback to apply the filter and draw the result on the display
    this.renderer.postUpdate = this.postUpdate;

    // add sprites
	this.addSprites();
};


pbBlankShaderDemo.prototype.destroy = function()
{
	console.log("pbBlankShaderDemo.destroy");

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;
};


pbBlankShaderDemo.prototype.restart = function()
{
	console.log("pbBlankShaderDemo.restart");
	
	this.destroy();
	this.create();
};


pbBlankShaderDemo.prototype.addSprites = function()
{
	console.log("pbBlankShaderDemo.addSprites");

	// add a single 'ball' sprite to the rootLayer
	this.spr = new pbSprite(200, 200, "ball", rootLayer);
};


pbBlankShaderDemo.prototype.update = function()
{
	// all normal sprites will be drawn to the rttTexture because of this.renderer.useFramebuffer in this.create
	// see pbPointLightsDemo for example how to draw directly to the display (the 'player' ship and 'rockets')
	// alternatively look at pbFilterDemo which draws to the rttTexture manually instead of redirecting renderer.update
};


/**
 * postUpdate - apply the shader to the rttTexture, then draw the results on screen
 *
 */
pbBlankShaderDemo.prototype.postUpdate = function()
{
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// copy the rttTexture to the filterFramebuffer attached texture, applying a shader as it draws
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	this.renderer.graphics.applyShaderToTexture(0, this.rttTexture, this.setShader, this);

	// draw the filter texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(1, this.filterTexture);
};


// callback required to set the correct shader program and it's associated attributes and/or uniforms
pbBlankShaderDemo.prototype.setShader = function(_shaders, _textureNumber)
{
   	// set the shader program
	_shaders.setProgram(this.shaderProgram, 0);

	// set the uniform values for the shader program
	gl.uniform1f( _shaders.getUniform( "uRedScale" ), 1.0 );
	gl.uniform1f( _shaders.getUniform( "uGreenScale" ), 0.25 );
	gl.uniform1f( _shaders.getUniform( "uBlueScale" ), 1.0 );
};

