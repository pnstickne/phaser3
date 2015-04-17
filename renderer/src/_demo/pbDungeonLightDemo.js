/**
 *
 * Empty demo file, loads a texture and sets up the renderer...
 *
 */



// created while the data is loading (preloader)
function pbDungeonLightDemo( docId )
{
	console.log( "pbDungeonLightDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.levelData = this.loader.loadFile( "../img/tiles/dungeon.json" );
	this.tileImg = this.loader.loadImage( "../img/tiles/gridtiles.png" );
	this.wizImg = this.loader.loadImage( "../img/wiz.png" );


	console.log( "pbDungeonLightDemo c'tor exit" );
}


pbDungeonLightDemo.prototype.allLoaded = function()
{
	console.log( "pbDungeonLightDemo.allLoaded" );

	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbDungeonLightDemo.prototype.create = function()
{
	console.log("pbDungeonLightDemo.create");

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
	this.createSurfaces();

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE1, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// set the frame buffer to be used as the destination during the draw phase of renderer.update (drawing the invaders)
   	this.renderer.useFramebuffer = this.rttFramebuffer;
   	this.renderer.useRenderbuffer = this.rttRenderbuffer;

	// create the filter destination texture and framebuffer
	this.filterTexture = pbWebGlTextures.initTexture(gl.TEXTURE2, pbRenderer.width, pbRenderer.height);
	this.filterFramebuffer = pbWebGlTextures.initFramebuffer(this.filterTexture, null);

	// set up the renderer postUpdate callback to apply the filter and draw the result on the display
    this.renderer.postUpdate = this.postUpdate;

    this.bouncex = 0;
    this.bouncey = 0;
    this.bouncedx = 1.5;
    this.bouncedy = 1.0;
};


pbDungeonLightDemo.prototype.destroy = function()
{
	console.log("pbDungeonLightDemo.destroy");

	if (this.surface)
		this.surface.destroy();
	this.surface = null;

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;

	this.filterTexture = null;
	this.filterFramebuffer = null;
};


pbDungeonLightDemo.prototype.createSurfaces = function()
{
	console.log("pbScrollDemo.createSurfaces");

	// set up the tiles in a pbSprite
	imageData = this.loader.getFile( this.tileImg );
	this.tileSurface = new pbSurface();
	this.tileSurface.create(this.tileMap.tilesets[0].tilewidth, this.tileMap.tilesets[0].tileheight, this.tileMap.tilesets[0].imagewidth / this.tileMap.tilesets[0].tilewidth, this.tileMap.tilesets[0].imageheight / this.tileMap.tilesets[0].tileheight, imageData);
	this.tileSurface.isNPOT = true;

	// create all the scrolling layers to draw from the tileSurface
	this.createLayers(this.tileSurface);
};


pbDungeonLightDemo.prototype.createLayers = function(_surface)
{
	// create the scrolling layers
	this.tileLayers = [];
	this.addLayer(_surface);
};


pbDungeonLightDemo.prototype.addLayer = function(_surface)
{
	var layer = new layerClass();
	layer.create(rootLayer, this.renderer, 0, 0, 1, 0, 1, 1);
	rootLayer.addChild(layer);

	var i = this.tileLayers.length;
	// draw map tiles into the new layer
	this.drawMap(layer);
	this.tileLayers.push(layer);
};


pbDungeonLightDemo.prototype.drawMap = function(_layer)
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


pbDungeonLightDemo.prototype.createTile = function(_x, _y, _cell)
{
	var img = new imageClass();
	img.create(this.tileSurface, _cell, 0, 0, false, false);
	var spr = new pbSprite();
	spr.create(img, _x, _y, 0.5, 0, 1, 1);
	return spr;
};


pbDungeonLightDemo.prototype.restart = function()
{
	console.log("pbDungeonLightDemo.restart");
	
	this.destroy();
	this.create();
};


pbDungeonLightDemo.prototype.addSprites = function()
{
	console.log("pbDungeonLightDemo.addSprites");

};


pbDungeonLightDemo.prototype.update = function()
{
};


/**
 * postUpdate - apply the filter to the rttTexture, then draw the results on screen
 *
 */
pbDungeonLightDemo.prototype.postUpdate = function()
{
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// copy the rttTexture to the filterFramebuffer attached texture, applying a filter as it draws
	gl.activeTexture(gl.TEXTURE1);
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	this.renderer.graphics.applyFilterToTexture(1, this.rttTexture, this.setFilter, this);

	// draw the filter texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.activeTexture(gl.TEXTURE2);
	this.renderer.graphics.drawTextureToDisplay(2, this.filterTexture);
//	this.renderer.graphics.drawTextureToDisplay(1, this.rttTexture);
};


var lightData = [
// x, y, power/color, range
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
];


// pack bytes _r, _g and _b into a single float with four precision bits each
function pack(_r, _g, _b)
{
	return (Math.floor(_r * 16.0) + Math.floor(_g * 16.0) * 256.0 + Math.floor(_b * 16.0) * 256.0 * 256.0);
}


pbDungeonLightDemo.prototype.setLightData = function()
{
	this.bouncex += this.bouncedx;
	if (this.bouncex < 0) this.bouncedx = Math.abs(this.bouncedx);
	if (this.bouncex > pbRenderer.width) this.bouncedx = -Math.abs(this.bouncedx);
	this.bouncey += this.bouncedy;
	if (this.bouncey < 0) this.bouncedy = Math.abs(this.bouncedy);
	if (this.bouncey > pbRenderer.height) this.bouncedy = -Math.abs(this.bouncedy);

	// first light is attached to the player ship
	lightData[0 * 4 + 0] = this.bouncex / pbRenderer.width;
	lightData[0 * 4 + 1] = 1.0 - this.bouncey / pbRenderer.height;
	lightData[0 * 4 + 2] = pack(1.0, 0.8, 0.5);
	lightData[0 * 4 + 3] = 0.25;

	var i, j;
	for(i = 0; i < 15; i++)
	{
		j = (i + 1) * 4;
		// a light with power/colour of zero is switched off
		lightData[j + 2] = 0.0;
	}
};


// callback required to set the correct filter program and it's associated attributes and/or uniforms
pbDungeonLightDemo.prototype.setFilter = function(_filters, _textureNumber)
{
   	// set the filter program
	_filters.setProgram(_filters.multiLightShaderProgram, _textureNumber);

	// set the parameters for the filter shader program
	this.setLightData();

	// send them to the shader
	gl.uniform4fv( pbWebGlShaders.currentProgram.uniforms.uLights, lightData );
};
