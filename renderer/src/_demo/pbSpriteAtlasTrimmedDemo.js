/**
 *
 * Sprite Atlas demo using Trimmed data
 *
 */



// created while the data is loading (preloader)
function pbSpriteAtlasTrimmedDemo( docId )
{
	console.log( "pbSpriteAtlasTrimmedDemo c'tor entry" );

	var _this = this;

	this.jsonData = null;
	this.surface = null;
	this.list = null;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( useRenderer, this.create, this.update, this );
	pbPhaserRender.loader.loadImage( "original", "../img/spriteAtlas/test_original.png", 64, 64, 2, 2 );
	this.ball = pbPhaserRender.loader.loadImage( "ball", "../img/spriteAtlas/test.png" );
	this.ballJSON = pbPhaserRender.loader.loadFile( "../img/spriteAtlas/test.json" );

	console.log( "pbSpriteAtlasTrimmedDemo c'tor exit" );
}


pbSpriteAtlasTrimmedDemo.prototype.allLoaded = function()
{
	console.log( "pbSpriteAtlasTrimmedDemo.allLoaded" );

	this.phaserRender = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbSpriteAtlasTrimmedDemo.prototype.create = function()
{
	console.log("pbSpriteAtlasTrimmedDemo.create");

	// get the atlas data
	var jsonString = pbPhaserRender.loader.getFile( this.ballJSON ).responseText;

	// create a surface for the sprite atlas
	this.surface = new pbSurface();
	// initialise the surface using the loaded image and the atlas JSON
	this.surface.createAtlas(jsonString, pbPhaserRender.loader.getFile( this.ball ));

	this.original = new pbSprite();
	this.original.createWithKey(200, 300, 'original', rootLayer);

	this.addSprites();
};


pbSpriteAtlasTrimmedDemo.prototype.destroy = function()
{
	console.log("pbSpriteAtlasTrimmedDemo.destroy");

	this.surface.destroy();
	this.ball = null;
	this.ballJSON = null;
	this.list = null;

	if (this.phaserRender)
		this.phaserRender.destroy();
	this.phaserRender = null;
};


pbSpriteAtlasTrimmedDemo.prototype.restart = function()
{
	console.log("pbSpriteAtlasTrimmedDemo.restart");
	
	this.destroy();
	this.create();
};


pbSpriteAtlasTrimmedDemo.prototype.addSprites = function()
{
	console.log("pbSpriteAtlasTrimmedDemo.addSprites");

	this.list = [];
	for(var i = 0; i < 1; i++)
	{
		var img = new imageClass();
		img.create(this.surface, i, 0.5, 0.5);
		var spr = new pbTransformObject();
		spr.create(img, this.original.x + 128, this.original.y, 1.0, 0, 1, 1);
		spr.animDir = 0.1;
		rootLayer.addChild(spr);

		this.list[i] = {
			sprite: spr,
			dx: 0,
			dy: 0,
			rot: 0
		};
	}
};


pbSpriteAtlasTrimmedDemo.prototype.update = function()
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

		spr.image.cellFrame += spr.animDir;
		if (spr.image.cellFrame >= spr.image.surface.cells)
		{
			spr.image.cellFrame = spr.image.surface.cells - 1;
			spr.animDir = -spr.animDir;
		}
		if (spr.image.cellFrame < 0)
		{
			spr.image.cellFrame = 0;
			spr.animDir = -spr.animDir;
			spr.angleInRadians += 0.1;
		}

		// make the original sprite match the animation and rotation of the reconstructed atlas version
		this.original.cellFrame = spr.image.cellFrame;
		this.original.angleInRadians = spr.angleInRadians;
	}
};

