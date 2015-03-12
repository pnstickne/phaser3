/**
 *
 * A render-to-texture demo for the new Phaser 3 renderer.
 *
 */



// created while the data is loading (preloader)
function pbRenderTextureDemo( docId )
{
	console.log( "pbRenderTextureDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.firstTime = true;
	this.surface = null;
	this.layer = null;
	this.renderSurface = null;
	this.displayLayer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/sphere3.png" );

	console.log( "pbRenderTextureDemo c'tor exit" );
}


pbRenderTextureDemo.prototype.allLoaded = function()
{
	console.log( "pbRenderTextureDemo.allLoaded" );

	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbRenderTextureDemo.prototype.create = function()
{
	console.log("pbRenderTextureDemo.create");

	this.addSprites();
};


pbRenderTextureDemo.prototype.destroy = function()
{
	console.log("pbRenderTextureDemo.destroy");

	this.surface.destroy();
	this.surface = null;

	this.renderer.destroy();
	this.renderer = null;
};


pbRenderTextureDemo.prototype.restart = function()
{
	console.log("pbRenderTextureDemo.restart");
	
	this.destroy();
	this.create();
};


pbRenderTextureDemo.prototype.addSprites = function()
{
	console.log("pbRenderTextureDemo.addSprites");

	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, image);

	var img = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	img.create(this.surface, 0, 0.5, 0.5);
	// draw this image to a render-to-texture, not the display
	img.toTexture = true;

	this.layer = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.layer.create(rootLayer, this.renderer, 0,0,0, 0, 1, 1);
	// attach the layer to the rootLayer so it gets processed by renderer.update
	// nothing will be drawn on rootLayer because the pbImage.toTexture flag is true
	// drawing will go to a render-to-texture instead
	rootLayer.addChild(this.layer);

	this.spr = new pbSprite();
	// _image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.spr.create(img, 200, 200, 1.0, 0, 1.0, 1.0);
	this.layer.addChild(this.spr);

	this.dirx = 2;
};


pbRenderTextureDemo.prototype.update = function()
{
	// rotate
	this.spr.angleInRadians += 0.01;

	// bounce the sprite across the renderer view
	this.spr.x += this.dirx;
	if (this.spr.x < 150) this.dirx = -this.dirx;
	if (this.spr.x > pbRenderer.width - 150) this.dirx = -this.dirx;


	// don't try to grab the render texture before it's even been created...
	if (this.renderer.graphics.textures.rtTexture)
	{
		// this.renderer.graphics.textures.prepareRenderTexture();

		// prepare the texture to be grabbed by attaching it to a frame buffer (once only)
		if (!this.renderer.graphics.textures.canReadTexture)
			this.renderer.graphics.textures.prepareTextureForAccess(this.renderer.graphics.textures.rtTexture);

		// grab the webGl.currentTexture and draw it into the destination canvas as ImageData
		this.renderSurface = this.renderer.graphics.textures.getTextureToSurface(gl);

		// first time we obtain the rendered surface, attach it so it'll get rendered to the rootLayer
		if (this.firstTime)
		{
			// this image does not set toTexture, it'll display as normal instead of being rendered to a texture

			var img = new imageClass();
			// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
			img.create(this.renderSurface, 0, 0.5, 0.5);

			this.renderSprite = new pbSprite();
			// _image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
			this.renderSprite.create(img, 0, 0, 0, 0, 1, 1);

			this.displayLayer = new pbLayer();
			// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
			this.displayLayer.create(rootLayer, this.renderer, 0,0,0, 0, 1, 1);
			rootLayer.addChild(this.displayLayer);

			this.firstTime = false;
		}
	}
};

