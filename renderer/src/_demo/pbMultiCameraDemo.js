/**
 *
 * A multiple camera demo using render-to-texture for the new Phaser 3 renderer.
 * This demo draws multiple instances of the Invaders Core demo to textures, then it directly accesses the textures
 * using pbWebGl.drawTextureWithTransform as the source surface for multiple bouncing, rotating, scaling camera sprite.
 * NOTE: all cameras are displaying the same source texture which is a single instance of the invaders core demo...
 * this is to show how fast the camera technique is without being bogged down by lots of CPU game instances.
 *
 */

// created while the data is loading (preloader)
function pbMultiCameraDemo( docId )
{
	console.log( "pbMultiCameraDemo c'tor entry" );

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
	this.starsImg = this.loader.loadImage( "../img/invader/starfield.png" );
	this.bulletImg = this.loader.loadImage( "../img/invader/bullet.png" );
	this.bombImg = this.loader.loadImage( "../img/invader/enemy-bullet.png" );
	this.rocketImg = this.loader.loadImage( "../img/invader/rockets32x32x8.png" );
	this.smokeImg = this.loader.loadImage( "../img/invader/smoke64x64x8.png" );
	this.explosionImg = this.loader.loadImage( "../img/invader/explode.png" );
	this.fontImg = this.loader.loadImage( "../img/fonts/arcadeFonts/16x16/Bubble Memories (Taito).png" );

	console.log( "pbMultiCameraDemo c'tor exit" );
}


pbMultiCameraDemo.prototype.allLoaded = function()
{
	console.log( "pbMultiCameraDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbMultiCameraDemo.prototype.create = function()
{
	console.log("pbMultiCameraDemo.create");

	this.gameLayer = new layerClass();
	this.gameLayer.create(rootLayer, this.renderer, 0, 0, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.gameLayer);

	// add the game instance to a layer which is attached to the rootLayer
	// because otherwise the renderer.update won't update the game's sprite
	// transforms or draw them to the render-to-texture
	this.game = new pbInvaderDemoCore();
	this.game.create(this, this.gameLayer);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	this.tx = [];
	this.tdx = [];
	this.ty = [];
	this.tdy = [];
	this.tr = [];
	this.tdr = [];
	this.ts = [];
	this.tds = [];
	this.transform = [];
	for(var i = 0; i < 100; i++)
	{
		// bouncing, scaling, spinning variables
		this.tx[i] = Math.random() * pbRenderer.width;
		this.tdx[i] = 6 * Math.random() - 3;
		this.ty[i] = Math.random() * pbRenderer.height;
		this.tdy[i] = 4 * Math.random() - 2;
		this.tr[i] = Math.PI * 2.0 * Math.random();
		this.tdr[i] = 0.02 * Math.random() - 0.01;
		this.ts[i] = 0.23 * Math.random() + 0.26;
		this.tds[i] = 0.002 * Math.random() - 0.001;
		// create a transform matrix to draw this image with
		this.transform[i] = pbMatrix3.makeTransform(this.tx[i], this.ty[i], this.tr[i], this.ts[i], this.ts[i]);
	}

	// set up the renderer postUpdate callback to draw the camera sprite using the render-to-texture surface on the GPU
    this.renderer.postUpdate = this.postUpdate;

	// set the frame buffer to be used as the destination during the draw phase of renderer.update
   	this.renderer.useFramebuffer = this.rttFramebuffer;
   	this.renderer.useRenderbuffer = this.rttRenderbuffer;
};


pbMultiCameraDemo.prototype.destroy = function()
{
	console.log("pbMultiCameraDemo.destroy");

	this.gameLayer.destroy();
	this.gameLayer = null;

	this.renderer.destroy();
	this.renderer = null;

	this.game.destroy();
	this.game = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
};


pbMultiCameraDemo.prototype.update = function()
{
	// update the invaders demo core
	this.game.update();
};


/**
 * postUpdate - draw the camera sprite using the render-to-texture surface on the GPU
 *
 */
pbMultiCameraDemo.prototype.postUpdate = function()
{
	// don't render to texture any more, render to the display instead
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	for(var i = 0; i < this.transform.length; i++)
	{
		// move the draw image around
		this.tx[i] += this.tdx[i];
		if (this.tx[i] <= 0 || this.tx[i] >= pbRenderer.width) this.tdx[i] = -this.tdx[i];
		this.ty[i] += this.tdy[i];
		if (this.ty[i] <= 0 || this.ty[i] >= pbRenderer.height) this.tdy[i] = -this.tdy[i];
		this.tr[i] += this.tdr[i];
		if (this.tr[i] >= Math.PI * 2.0) this.tr[i] -= Math.PI * 2.0;
		this.ts[i] += this.tds[i];
		if (this.ts[i] <= 0.2 || this.ts[i] >= 0.5) this.tds[i] = -this.tds[i];
		this.transform[i] = pbMatrix3.makeTransform(this.tx[i], this.ty[i], this.tr[i], this.ts[i], this.ts[i]);

		// _image, _transform, _z
		this.renderer.graphics.drawTextureWithTransform( this.rttTexture, this.transform[i], 1.0 );
	}
};

