/**
 *
 * pbSciFlyDemo.js - a scrolling tile world demo based on the old Phaser "sci fly" example project
 *
 */



function pbSciFlyDemo( docId )
{
	console.log( "pbSciFlyDemo c'tor entry" );

	var _this = this;

	this.numLayers = 1;

	this.tileMap = null;
	this.bgSpr = null;
	this.tileSurface = null;
	this.mapSprites = null;
	this.scrollLayers = null;
	this.mapWidth = 0;
	this.mapHeight = 0;
	this.fps60 = 0;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( useRenderer, this.create, this.update, this );
	this.levelData = pbPhaserRender.loader.loadFile( "../img/tiles/cybernoid.json" );
	this.tileImg = pbPhaserRender.loader.loadImage( "tiles", "../img/tiles/cybernoid.png" );
	this.shipImg = pbPhaserRender.loader.loadImage( "phaser", "../img/tiles/phaser-ship.png" );
	this.chunkImg = pbPhaserRender.loader.loadImage( "chunk", "../img/tiles/chunk.png" );

	console.log( "pbSciFlyDemo c'tor exit" );
}


pbSciFlyDemo.prototype.create = function()
{
	console.log("pbSciFlyDemo.create");

	var tileMapJSON = pbPhaserRender.loader.getFile(this.levelData).responseText;

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

	this.createSurfaces();
};


pbSciFlyDemo.prototype.destroy = function()
{
	console.log("pbSciFlyDemo.destroy");

	this.phaserRender.destroy();
	this.phaserRender = null;

	this.tileMap = null;
	this.tileSurface.destroy();
	this.tileSurface = null;
	this.mapSprites = null;

	for(var i = 0, l = this.scrollLayers.length; i < l; i++)
		this.scrollLayers[i].destroy();
	this.scrollLayers = null;

	this.loader = null;

	this.levelData = null;
	this.tileImg = null;
	this.shipImg = null;
	this.chunkImg = null;
};


pbSciFlyDemo.prototype.restart = function()
{
	console.log("pbSciFlyDemo.restart");
	
	this.destroy();
	this.create();
};


pbSciFlyDemo.prototype.createSurfaces = function()
{
	console.log("pbSciFlyDemo.createSurfaces");

	// set up the tiles in a pbTransformObject
	imageData = pbPhaserRender.loader.getFile( this.tileImg );
	this.tileSurface = new pbSurface();
	this.tileSurface.createGrid(this.tileMap.tilesets[0].tilewidth, this.tileMap.tilesets[0].tileheight, this.tileMap.tilesets[0].imagewidth / this.tileMap.tilesets[0].tilewidth, this.tileMap.tilesets[0].imageheight / this.tileMap.tilesets[0].tileheight, imageData);

	// create all the scrolling layers to draw from the tileSurface
	this.createLayers(this.tileSurface);
};


pbSciFlyDemo.prototype.createLayers = function(_surface)
{
	// create the scrolling layers
	this.scrollLayers = [];
	for(var i = 0; i < this.numLayers; i++)
		this.addLayer(_surface);
};


pbSciFlyDemo.prototype.addLayer = function(_surface)
{
	var layer = new pbSimpleLayer();	//new layerClass();
	// create a clipping rectangle for the layer which is around the screen
	// tiles outside of this clipping rectangle will be culled in the layer.prepareXYUV function
	var clipRect = new pbRectangle(-this.tileMap.tilesets[0].tilewidth, -this.tileMap.tilesets[0].tileheight, pbPhaserRender.width + this.tileMap.tilesets[0].tilewidth, pbPhaserRender.height + this.tileMap.tilesets[0].tileheight);
	layer.create(rootLayer, this.phaserRender, 0, 0, this.tileSurface, clipRect);
	layer.setDrawingFunctions( layer.prepareXYUV, layer.drawAnim );	

	rootLayer.addChild(layer);
	var i = this.scrollLayers.length;
	layer.dirX = 1 / (i + 1);
	layer.dirY = 1 - 1 / (i + 1);
	// add map tiles into the new layer
	this.drawMap(layer);
	this.scrollLayers.push(layer);
};


pbSciFlyDemo.prototype.drawMap = function(_layer)
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
				var s = this.createTile(x * this.tileMap.tilesets[0].tilewidth, y * this.tileMap.tilesets[0].tileheight, tile - 1);
				_layer.addChild(s);
				this.mapSprites[y][x] = s;
			}
		}
	}
};


pbSciFlyDemo.prototype.createTile = function(_x, _y, _cell)
{
	var img = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	img.create(this.tileSurface, _cell, 0, 0, false, false);
	var spr = new pbTransformObject();
	spr.create(img, _x, _y, 0.5, 0, 1, 1);
	return spr;
};


pbSciFlyDemo.prototype.update = function()
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

		if (sx >= this.mapWidth - pbPhaserRender.width)
		{
			sx = this.mapWidth - pbPhaserRender.width - 1;
			this.scrollLayers[i].dirX = -this.scrollLayers[i].dirX;
		}

		if (sy <= 0)
		{
			sy = 0;
			this.scrollLayers[i].dirY = -this.scrollLayers[i].dirY;
		}

		if (sy >= this.mapHeight - pbPhaserRender.height)
		{
			sy = this.mapHeight - pbPhaserRender.height - 1;
			this.scrollLayers[i].dirY = -this.scrollLayers[i].dirY;
		}

		this.scrollLayers[i].x = -sx;
		this.scrollLayers[i].y = -sy;
	}
};

