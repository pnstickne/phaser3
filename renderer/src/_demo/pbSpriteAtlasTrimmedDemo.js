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
	this.ballSingle = pbPhaserRender.loader.loadImage( "ball1", "../img/spriteAtlas/ballSingle.png" );

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

	// create a 'single' sprite surface to test the trimming offset parameters
	this.single = new pbSurface();
	//_imageData, _rttTexture, _rttTextureRegister, _trimmedFrom, _offsets)
	// trimming data specifies that this 32x32 image was originally enclosed in a 100x100 surface, at an offset of 50-16 (centred on 50 x) and 100-16 (centred on 100 y)
	// the expected result is that the sprite will draw at the next horizontal position (they are all evenly spaced) but down from the line formed by the others
	// it should rotate around the centre of the 100x100 sprite (defining circles around the next in line position)
	this.single.createSingle(pbPhaserRender.loader.getFile( this.ballSingle ), undefined, undefined, { width: 100, height:100 }, { x: 50 - 16, y: 100 - 16 });

	this.original = new pbSprite();
	this.original.createWithKey(200, 300, 'original', rootLayer);
	this.original.anchorX = 0.5;
	this.original.anchorY = 0.5;

	this.addSprites();
};


pbSpriteAtlasTrimmedDemo.prototype.destroy = function()
{
	console.log("pbSpriteAtlasTrimmedDemo.destroy");

	this.surface.destroy();
	this.single.destroy();
	this.original.destroy();
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
	var i = 0;
	for(; i < 2; i++)
	{
		// add multiple instances of this atlas trimmed surface as transform objects
		var img = new imageClass();
		img.create(this.surface, 0, 0.5, 0.5);
		var obj = new pbTransformObject();
		obj.create(img, this.original.x + 64 * (i + 1), this.original.y, 1.0, 0, 1, 1);
		rootLayer.addChild(obj);
		this.list[i] = {
			transformObj: obj,
			dir: 0.1
		};
	}

	// add a single instance of the trimmed single surface as a transform object
	var img2 = new imageClass();
	img2.create(this.single, 0, 0.5, 0.5);
	var obj2 = new pbTransformObject();
	obj2.create(img2, this.original.x + 64 * (i + 1), this.original.y, 1.0, 0, 1, 1);
	rootLayer.addChild(obj2);
	this.list[i++] = {
		transformObj: obj2,
		dir: 0.1
	};

};


pbSpriteAtlasTrimmedDemo.prototype.update = function()
{
	var obj;

	for(var i = 0, l = this.list.length; i < l; i++)
	{
		obj = this.list[i].transformObj;

		// advance the animation cell number
		obj.image.cellFrame += this.list[i].dir;
		if (obj.image.cellFrame >= obj.image.surface.cells)
		{
			obj.image.cellFrame = obj.image.surface.cells - 1;
			this.list[i].dir = -this.list[i].dir;
		}

		if (obj.image.cellFrame < 0)
		{
			obj.image.cellFrame = 0;
			this.list[i].dir = -this.list[i].dir;
			// rotate once each time the animation restarts at the beginning
			// NOTE: for the single sprite this will rotate every time it attempts to animate
			obj.angleInRadians += 0.1;
		}
	}

	obj = this.list[0].transformObj;
	if (obj)
	{
		// make the original sprite match the animation and rotation of the reconstructed atlas version
		this.original.cellFrame = obj.image.cellFrame;
		this.original.angleInRadians = obj.angleInRadians;
	}
};

