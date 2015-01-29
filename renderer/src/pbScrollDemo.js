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
	this.bgSpr = null;
	this.tileSurface = null;
	this.tileImage = null;
	this.mapSprites = null;
	this.scrollLayer = null;
	this.scrollX = 0;
	this.scrollY = 0;
	this.dirX = 0;
	this.dirY = 0;
	this.mapWidth = 0;
	this.mapHeight = 0;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.levelData = this.loader.loadFile( "../img/tiles/level1.json" );
	this.bgImg = this.loader.loadImage( "../img/tiles/background_128x512.png" );
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

	this.scrollX = 0;
	this.scrollY = 0;
	this.dirX = 1;
	this.dirY = 1;
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

	// the background image (tiled and stretched to fill the whole viewport)
	var image = this.loader.getFile( this.bgImg );
	var surface = new pbSurface();
	surface.create(0, 0, 1, 1, image);
	// tiled background to fill the width of the screen...
	surface.cellTextureBounds[0][0].width = this.renderer.width / surface.cellWide;
	var img = new pbImage();
	img.create(surface, 0, 0, 0, true, false);
	this.bgSpr = new pbSprite();
	// scale the tiled background to compensate for the extra drawn width from tiling
	// TODO: create a simple API to fix surface and sprite scaling, or add a separate variable to handle tiling properly
	this.bgSpr.create(img, 0, 0, 1.0, 0, this.renderer.width / surface.cellWide, this.renderer.height / surface.cellHigh);
	rootLayer.addChild(this.bgSpr);

	// set up the tiles in a pbSprite
	image = this.loader.getFile( this.tileImg );
	this.tileSurface = new pbSurface();
	this.tileSurface.create(this.tileMap.tilesets[0].tilewidth, this.tileMap.tilesets[0].tileheight, this.tileMap.tilesets[0].imagewidth / this.tileMap.tilesets[0].tilewidth, this.tileMap.tilesets[0].imageheight / this.tileMap.tilesets[0].tileheight, image);
	this.tileSurface.isNPOT = true;

	// create the scrolling layer
	this.scrollLayer = new pbLayer();
	this.scrollLayer.create(rootLayer, this.renderer, 0, 0, 1, 0, 1, 1);
	rootLayer.addChild(this.scrollLayer);

	// draw the tiles into the scrolling layer
	this.drawMap();
};


pbScrollDemo.prototype.drawMap = function()
{
	// pre-calc pixel dimensions of map
	this.mapWidth = this.tileMap.layers[0].width * this.tileMap.tilesets[0].tilewidth;
	this.mapHeight = this.tileMap.layers[0].height * this.tileMap.tilesets[0].tileheight;

	this.mapSprites = [];
	for(var y = 0; y < this.tileMap.layers[0].height; y++)
	{
		this.mapSprites[y] = [];
		for(var x = 0; x < this.tileMap.layers[0].width; x++)
		{
			var tile = this.tileMap.layers[0].data[x + y * this.tileMap.layers[0].width];

			// 0 tile number is empty space, all other tile numbers are +1 their actual index position in the tile texture
			if (tile !== 0)
			{
				this.mapSprites[y][x] = this.createTile(x * this.tileMap.tilesets[0].tilewidth, y * this.tileMap.tilesets[0].tileheight, tile - 1);
				this.scrollLayer.addChild(this.mapSprites[y][x]);
			}
		}
	}
};


pbScrollDemo.prototype.createTile = function(_x, _y, _cell)
{
	var img = new pbImage();
	img.create(this.tileSurface, _cell, 0, 0, false, false);
	var spr = new pbSprite();
	spr.create(img, _x, _y, 0.5, 0, 1, 1);
	return spr;
};


pbScrollDemo.prototype.update = function()
{
	this.scrollX += this.dirX;
	this.scrollY += this.dirY;

	if (this.scrollX <= 0)
	{
		this.scrollX = 0;
		this.dirX = -this.dirX;
	}

	if (this.scrollX >= this.mapWidth - this.renderer.width)
	{
		this.scrollX = this.mapWidth - this.renderer.width - 1;
		this.dirX = -this.dirX;
	}

	if (this.scrollY <= 0)
	{
		this.scrollY = 0;
		this.dirY = -this.dirY;
	}

	if (this.scrollY >= this.mapHeight - this.renderer.height)
	{
		this.scrollY = this.mapHeight - this.renderer.height - 1;
		this.dirY = -this.dirY;
	}

	this.scrollLayer.x = -this.scrollX;
	this.scrollLayer.y = -this.scrollY;
};

