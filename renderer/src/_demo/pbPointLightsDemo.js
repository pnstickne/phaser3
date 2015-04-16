/**
 *
 * Point lights demo - uses a shader to generate lighting and shadows from multiple point sources.
 *
 */



// created while the data is loading (preloader)
function pbPointLightsDemo( docId )
{
	console.log( "pbPointLightsDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.gameLayer = null;
	this.game = null;

	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.playerImg = this.loader.loadImage( "../img/invader/player.png" );
	this.invaderImg = this.loader.loadImage( "../img/invader/invader32x32x4.png" );
	this.saucerImg = this.loader.loadImage( "../img/invader/invader.png" );
	//this.starsImg = this.loader.loadImage( "../img/invader/starfield.png" );
	this.bulletImg = this.loader.loadImage( "../img/invader/bullet.png" );
	this.bombImg = this.loader.loadImage( "../img/invader/enemy-bullet.png" );
	this.rocketImg = this.loader.loadImage( "../img/invader/rockets32x32x8.png" );
	this.smokeImg = this.loader.loadImage( "../img/invader/smoke64x64x8.png" );
	this.explosionImg = this.loader.loadImage( "../img/invader/explode.png" );
	this.fontImg = this.loader.loadImage( "../img/fonts/arcadeFonts/16x16/Bubble Memories (Taito).png" );

	this.logoImg = this.loader.loadImage( "../img/phaser_128x32.png" );

	console.log( "pbPointLightsDemo c'tor exit" );
}


pbPointLightsDemo.prototype.allLoaded = function()
{
	console.log( "pbPointLightsDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbPointLightsDemo.prototype.create = function()
{
	console.log("pbPointLightsDemo.create");

	// create a player ship which is not a shadow caster
	var imageData = this.loader.getFile( this.playerImg );
	this.surface = new pbSurface();
	// _wide, _high, _numWide, _numHigh, _image
	this.surface.create(0, 0, 1, 1, imageData);
	this.shipImage = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	this.shipImage.create(this.surface, 0, 0.5, 0.5);
	// create a transform matrix to draw this image with
	this.shipTransform = pbMatrix3.makeTransform(pbRenderer.width * 0.5, pbRenderer.height * 0.75, 0, 3, 3);

	//
	// draw an instance of invaders as a shadow-caster
	//

	this.gameLayer = new layerClass();
	this.gameLayer.create(rootLayer, this.renderer, 0, 0, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.gameLayer);

	// add the game instance to a layer which is attached to the rootLayer
	// because otherwise the renderer.update won't update the game's sprite
	// transforms or draw them to the render-to-texture
	this.game = new pbInvaderDemoCore();
	this.game.create(this, this.gameLayer, false, false);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// set the frame buffer to be used as the destination during the draw phase of renderer.update (drawing the invaders)
   	this.renderer.useFramebuffer = this.rttFramebuffer;
   	this.renderer.useRenderbuffer = this.rttRenderbuffer;

	// create the filter destination texture and framebuffer
	this.filterTexture = pbWebGlTextures.initTexture(gl.TEXTURE1, pbRenderer.width, pbRenderer.height);
	this.filterFramebuffer = pbWebGlTextures.initFramebuffer(this.filterTexture, null);

	// set up the renderer postUpdate callback to apply the filter and draw the result on the display
    this.renderer.postUpdate = this.postUpdate;
};


pbPointLightsDemo.prototype.destroy = function()
{
	console.log("pbPointLightsDemo.destroy");

	this.gameLayer.destroy();
	this.gameLayer = null;

	this.renderer.destroy();
	this.renderer = null;

	this.game.destroy();
	this.game = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;

	this.filterTexture = null;
	this.filterFramebuffer = null;
};


pbPointLightsDemo.prototype.update = function()
{
	// update and draw the invaders demo core to the render-to-texture
	this.game.update();
};


/**
 * postUpdate - apply the filter to the rttTexture, then draw the results on screen
 *
 */
pbPointLightsDemo.prototype.postUpdate = function()
{
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// copy the rttTexture to the filterFramebuffer attached texture, applying a filter as it draws
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	this.renderer.graphics.applyFilterToTexture(0, this.rttTexture, this.setFilter, this);

	// draw sprites that are not shadow casters
	this.renderer.graphics.drawImageWithTransform(this.shipImage, this.game.player.transform, 1.0);

	// draw the filter texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(1, this.filterTexture);
};


// callback required to set the correct filter program and it's associated attributes and/or uniforms
pbPointLightsDemo.prototype.setFilter = function(_filters, _textureNumber)
{
   	// set the filter program
	_filters.setProgram(_filters.multiLightShaderProgram, _textureNumber);

	// set the parameters for the filter shader program
	gl.uniform1f( pbWebGlShaders.currentProgram.uniforms.uLightPosX, this.game.player.x / pbRenderer.width );
	gl.uniform1f( pbWebGlShaders.currentProgram.uniforms.uLightPosY, 1.0 - this.game.player.y / pbRenderer.height );
};

   	
