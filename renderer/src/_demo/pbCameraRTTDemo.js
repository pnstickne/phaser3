/**
 *
 * A camera demo using render-to-texture for the new Phaser 3 renderer.
 *
 *
 */

// created while the data is loading (preloader)
function pbCameraRTTDemo( docId )
{
	console.log( "pbCameraRTTDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.layer = null;
	this.game = null;
	this.firstTime = true;
	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.playerImg = this.loader.loadImage( "../img/invader/player.png" );
	this.invaderImg = this.loader.loadImage( "../img/invader/invader32x32x4.png" );
	this.saucerImg = this.loader.loadImage( "../img/invader/invader.png" );
	this.starsImg = this.loader.loadImage( "../img/invader/starfield.png" );
	this.bulletImg = this.loader.loadImage( "../img/invader/bullet.png" );
	this.bombImg = this.loader.loadImage( "../img/invader/enemy-bullet.png" );
	this.rocketImg = this.loader.loadImage( "../img/invader/rockets32x32x8.png" );
	this.smokeImg = this.loader.loadImage( "../img/invader/smoke64x64x8.png" );
	this.explosionImg = this.loader.loadImage( "../img/invader/explode.png" );
	this.fontImg = this.loader.loadImage( "../img/fonts/arcadeFonts/16x16/Bubble Memories (Taito).png" );

	console.log( "pbCameraRTTDemo c'tor exit" );
}


pbCameraRTTDemo.prototype.allLoaded = function()
{
	console.log( "pbCameraRTTDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbCameraRTTDemo.prototype.create = function()
{
	console.log("pbCameraRTTDemo.create");

	this.layer = new layerClass();
	this.layer.create(rootLayer, this.renderer, 0, 0, 1, 0, 1, 1);
	rootLayer.addChild(this.layer);
	this.game = new pbInvaderDemoCore();
	this.game.create(this, this.layer);
};


pbCameraRTTDemo.prototype.destroy = function()
{
	console.log("pbCameraRTTDemo.destroy");

	this.layer.destroy();
	this.layer = null;

	this.renderer.destroy();
	this.renderer = null;

	this.game.destroy();
	this.game = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
};


pbCameraRTTDemo.prototype.drawSceneToTexture = function(_fb)
{
	// bind the framebuffer so drawing will go to the associated texture and depth buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);

	// update the invaders demo core, drawing to the render-to-texture
	this.game.update();
};


pbCameraRTTDemo.prototype.update = function()
{
	if (this.firstTime)
	{
		// create the render-to-texture, depth buffer, and a frame buffer to hold them
		this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
		this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
		this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

		// create the RAM surface to download the texture to
		this.textureSurface = new pbSurface();
		// _wide, _high, _numWide, _numHigh, _image
		this.textureSurface.create(this.rttTexture.width, this.rttTexture.height, 1, 1, null);


		// _x, _y, _angleInRadians, _scaleX, _scaleY
		this.bgTransform = pbMatrix3.makeTransform(0, 0, 0, 1, 1);
		this.sprTransform = pbMatrix3.makeTransform(128, 32, 0, 1, 1);

	    // clear the gl bindings
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	    gl.bindTexture(gl.TEXTURE_2D, null);
	    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


		// don't do this again...
		this.firstTime = false;
	}

	// draw the scene using the render-to-texture framebuffer
	this.drawSceneToTexture(this.rttFramebuffer);
	this.renderer.graphics.textures.prepareTextureForAccess(this.rttTexture);
	this.renderer.graphics.textures.getTextureToSurface(this.textureSurface);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// draw the texture surface
	this.renderer.graphics.drawTextureToDisplay(0, this.rttTexture);
};
