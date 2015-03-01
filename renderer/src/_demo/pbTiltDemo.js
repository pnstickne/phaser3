/**
 *
 * Tilt demo file, loads a texture and sets up the renderer to show a 3D rotated sprite
 *
 */



// created while the data is loading (preloader)
function pbTiltDemo( docId )
{
	console.log( "pbTiltDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/car.png" );

	console.log( "pbTiltDemo c'tor exit" );
}


pbTiltDemo.prototype.allLoaded = function()
{
	console.log( "pbTiltDemo.allLoaded" );

	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbTiltDemo.prototype.create = function()
{
	console.log("pbTiltDemo.create");

	this.addSprites();
};


pbTiltDemo.prototype.destroy = function()
{
	console.log("pbTiltDemo.destroy");

	if (this.surface)
		this.surface.destroy();
	this.surface = null;

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;
};


pbTiltDemo.prototype.restart = function()
{
	console.log("pbTiltDemo.restart");
	
	this.destroy();
	this.create();
};


pbTiltDemo.prototype.addSprites = function()
{
	console.log("pbTiltDemo.addSprites");

	var layer3D = new pbWebGlLayer();
	rootLayer.addChild(layer3D);

	// create animation data and set destination for movement
	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, image);

	var img = new imageClass();
	img.create(this.surface, 0);

	this.spr = new pbSprite3D();
	//_image, _x, _y, _z, _rx, _ry, _rz, _scaleX, _scaleY, _scaleZ
	this.spr.create(img, pbRenderer.width * 0.5, pbRenderer.height * 0.5, 1.0, 0, 0, 0, 1.0, 1.0, 1.0);
	layer3D.addChild(this.spr);
};


pbTiltDemo.prototype.update = function()
{
};

