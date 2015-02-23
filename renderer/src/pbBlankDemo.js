/**
 *
 * Empty demo file, loads a texture and sets up the renderer...
 *
 */



// created while the data is loading (preloader)
function pbBlankDemo( docId )
{
	console.log( "pbBlankDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/sphere3.png" );

	console.log( "pbBlankDemo c'tor exit" );
}


pbBlankDemo.prototype.allLoaded = function()
{
	console.log( "pbBlankDemo.allLoaded" );

	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbBlankDemo.prototype.create = function()
{
	console.log("pbBlankDemo.create");

	this.addSprites();
};


pbBlankDemo.prototype.destroy = function()
{
	console.log("pbBlankDemo.destroy");

	if (this.surface)
		this.surface.destroy();
	this.surface = null;

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;
};


pbBlankDemo.prototype.restart = function()
{
	console.log("pbBlankDemo.restart");
	
	this.destroy();
	this.create();
};


pbBlankDemo.prototype.addSprites = function()
{
	console.log("pbBlankDemo.addSprites");

	// create animation data and set destination for movement
	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, image);

	var img = new pbImage();
	img.create(this.surface, 0);

	this.spr = new pbSprite();
	this.spr.create(img, 200, 200, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.spr);
};


pbBlankDemo.prototype.update = function()
{
};

