/**
 *
 * pbScrollDemo.js - a scrolling tile world with multiple levels of parallax
 *
 */



// created while the data is loading (preloader)
function pbScrollDemo( docId )
{
	console.log( "pbScrollDemo c'tor entry" );

	var _this = this;

	this.docId = docId;
	this.tileMap = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.levelData = this.loader.loadFile( "../img/tiles/level1.json" );
	this.bgImg = this.loader.loadImage( "../img/tiles/background2.png" );
	this.dudeImg = this.loader.loadImage( "../img/tiles/dude.png" );
	this.tileImg = this.loader.loadImage( "../img/tiles/tiles-1.png" );

	console.log( "pbScrollDemo c'tor exit" );
}


pbScrollDemo.prototype.allLoaded = function()
{
	console.log( "pbScrollDemo.allLoaded" );

	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );
};


pbScrollDemo.prototype.create = function()
{
	console.log("pbScrollDemo.create");

	var tileMapJSON = this.loader.getFile(this.levelData).responseText;

	// Tile Map data format:
	//
	// width: number
	// height: number
	// layers: array
	//		object:
	//			name: string ("Tile Layer 1")
	//			type: string ("tilelayer")
	//			x: number
	//			y: number
	//			width: number
	//			height: number
	//			opacity: number
	//			visible: boolean
	//	 		data: array
	// tilesets: array
	//		object:
	//			name: string ("tiles-1")
	//			firstgid: number
	//			image: string ("tiles-1.png")
	//			imagewidth: number
	//			imageheight: number
	//			margin: number
	//			spacing: number
	//			tilewidth: number
	//			tileheight: number
	//			properties: object
	// tilewidth: number (duplicate of tilesets object 'tilewidth')
	// tileheight: number (duplicate of tilesets object 'tileheight')
	// orientation: string ("orthogonal")
	// properties: object
	// version: number
	this.tileMap = JSON.parse(tileMapJSON);

	this.addSprites();
};


pbScrollDemo.prototype.destroy = function()
{
	console.log("pbScrollDemo.destroy");

	this.surface.destroy();
	this.surface = null;

	this.renderer.destroy();
	this.renderer = null;
};


pbScrollDemo.prototype.restart = function()
{
	console.log("pbScrollDemo.restart");
	
	this.destroy();
	this.create();
};


pbScrollDemo.prototype.addSprites = function()
{
	console.log("pbScrollDemo.addSprites");

	// create animation data and set destination for movement
	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, image);

	var img = new pbImage();
	img.create(this.renderer, this.surface, 0);

	this.spr = new pbSprite();
	this.spr.create(img, 200, 200, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.spr);
};


pbScrollDemo.prototype.update = function()
{
};

