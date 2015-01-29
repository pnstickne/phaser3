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

	this.numLayers = 8;

	this.docId = docId;
	this.tileMap = null;
	this.bgSpr = null;
	this.tileSurface = null;
	this.mapSprites = null;
	this.scrollLayers = null;
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
};


pbScrollDemo.prototype.destroy = function()
{
	console.log("pbScrollDemo.destroy");

	this.renderer.destroy();
	this.renderer = null;

	this.tileMap = null;
	this.bgSpr.destroy();
	this.bgSpr = null;
	this.tileSurface.destroy();
	this.tileSurface = null;
	this.mapSprites = null;

	for(var i = 0, l = this.scrollLayers.length; i < l; i++)
		this.scrollLayers[i].destroy();
	this.scrollLayers = null;

	this.loader = null;

	this.levelData = null;
	this.bgImg = null;
	this.dudeImg = null;
	this.tileImg = null;
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

	// create the scrolling layers
	this.scrollLayers = [];
	for(var i = 0; i < this.numLayers; i++)
	{
		this.scrollLayers[i] = new pbLayer();
		this.scrollLayers[i].create(rootLayer, this.renderer, 0, 0, 1, 0, 1, 1);
		rootLayer.addChild(this.scrollLayers[i]);
		this.scrollLayers[i].dirX = 1 / (i + 1);
		this.scrollLayers[i].dirY = 1 - 1 / (i + 1);
		// draw the tiles into the scrolling layer
		this.drawMap(i);
	}

};


pbScrollDemo.prototype.drawMap = function(_layer)
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
				this.scrollLayers[_layer].addChild(this.mapSprites[y][x]);
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
	for(var i = 0, l = this.scrollLayers.length; i < l; i++)
	{
		var sx = -(this.scrollLayers[i].x + this.scrollLayers[i].dirX);
		var sy = -(this.scrollLayers[i].y + this.scrollLayers[i].dirY);

		if (sx <= 0)
		{
			sx = 0;
			this.scrollLayers[i].dirX = -this.scrollLayers[i].dirX;
		}

		if (sx >= this.mapWidth - this.renderer.width)
		{
			sx = this.mapWidth - this.renderer.width - 1;
			this.scrollLayers[i].dirX = -this.scrollLayers[i].dirX;
		}

		if (sy <= 0)
		{
			sy = 0;
			this.scrollLayers[i].dirY = -this.scrollLayers[i].dirY;
		}

		if (sy >= this.mapHeight - this.renderer.height)
		{
			sy = this.mapHeight - this.renderer.height - 1;
			this.scrollLayers[i].dirY = -this.scrollLayers[i].dirY;
		}

		this.scrollLayers[i].x = -sx;
		this.scrollLayers[i].y = -sy;
	}
};

