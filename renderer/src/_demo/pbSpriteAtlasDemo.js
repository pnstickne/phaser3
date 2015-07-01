/**
 *
 * Sprite Atlas demo
 *
 */



// created while the data is loading (preloader)
function pbSpriteAtlasDemo( docId )
{
	console.log( "pbSpriteAtlasDemo c'tor entry" );

	var _this = this;

	this.jsonData = null;
	this.surface = null;
	this.list = null;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( useRenderer, this.create, this.update, this );
	this.dragon = pbPhaserRender.loader.loadImage( "dragon", "../img/spriteAtlas/dragon_atlas.png" );
	this.dragonJSON = pbPhaserRender.loader.loadFile( "../img/spriteAtlas/dragon_atlas.json" );

	console.log( "pbSpriteAtlasDemo c'tor exit" );
}


pbSpriteAtlasDemo.prototype.allLoaded = function()
{
	console.log( "pbSpriteAtlasDemo.allLoaded" );

	this.phaserRender = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbSpriteAtlasDemo.prototype.create = function()
{
	console.log("pbSpriteAtlasDemo.create");

	// get the atlas data
	var jsonString = pbPhaserRender.loader.getFile( this.dragonJSON ).responseText;

	// create a surface for the sprite atlas
	this.surface = new pbSurface();
	// initialise the surface using the loaded image and the atlas JSON
	this.surface.createAtlas(jsonString, pbPhaserRender.loader.getFile( this.dragon ));

	this.addSprites();
};


pbSpriteAtlasDemo.prototype.destroy = function()
{
	console.log("pbSpriteAtlasDemo.destroy");

	this.surface.destroy();
	this.dragon = null;
	this.dragonJSON = null;
	this.list = null;

	if (this.phaserRender)
		this.phaserRender.destroy();
	this.phaserRender = null;
};


pbSpriteAtlasDemo.prototype.restart = function()
{
	console.log("pbSpriteAtlasDemo.restart");
	
	this.destroy();
	this.create();
};


pbSpriteAtlasDemo.prototype.addSprites = function()
{
	console.log("pbSpriteAtlasDemo.addSprites");

	this.list = [];
	for(var i = 0; i < this.surface.cellTextureBounds.length; i++)
	{
		var img = new imageClass();
		img.create(this.surface, i, 0.5, 0.5);
		var spr = new pbTransformObject();
		spr.create(img, (i % 10) * 50, Math.floor(i / 10) * 50, 1.0, 0, 1, 1);
		rootLayer.addChild(spr);

		this.list[i] = {
			sprite: spr,
			dx: Math.random() - 0.5,
			dy: Math.random() - 0.5,
			rot: Math.random() - 0.5
		};
	}
};


pbSpriteAtlasDemo.prototype.update = function()
{
	for(var i = 0, l = this.list.length; i < l; i++)
	{
		var spr = this.list[i].sprite;
		spr.x += this.list[i].dx * 4.0;
		if (spr.x < 0) this.list[i].dx *= -1;
		if (spr.x >= pbPhaserRender.width) this.list[i].dx *= -1;
		spr.y += this.list[i].dy * 3.0;
		if (spr.y < 0) this.list[i].dy *= -1;
		if (spr.y >= pbPhaserRender.height) this.list[i].dy *= -1;
		spr.angleInRadians += this.list[i].rot * 0.02;
	}
};

