/**
 *
 * The soldier marching (pseudo-3d) demo for the new Phaser 3 renderer.
 *
 */



var frameCount = 0;


// created while the data is loading (preloader)
function pbSoldierDemo( docId )
{
	console.log( "pbSoldierDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.surface = null;
	this.targetx = 0;
	this.targety = 0;
	this.numSprites = 0;
	this.spriteList = null;

	// dat.GUI controlled variables and callbacks
	this.gui = new dat.GUI();
	var numCtrl = this.gui.add(this, "numSprites").min(0).max(MAX_SPRITES).step(250).listen();
	numCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });

	// this.useBatch = false;
	// var btcCtrl = this.gui.add(this, "useBatch");
	// btcCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/soldier_a_run.png" );

	console.log( "pbSoldierDemo c'tor exit" );
}


pbSoldierDemo.prototype.allLoaded = function()
{
	console.log( "pbSoldierDemo.allLoaded" );

	this.renderer = new pbRenderer( this.docId, this.update, this );
	this.create();
};


pbSoldierDemo.prototype.create = function()
{
	console.log("pbSoldierDemo.create");

	this.targetx = 0;
	this.targety = 460;

	this.spriteList = [];
};


pbSoldierDemo.prototype.destroy = function()
{
	console.log("pbSoldierDemo.destroy");

	this.gui.destroy();

	this.spriteList = null;
	this.surface.destroy();
	this.surface = null;

	this.renderer.destroy();
	this.renderer = null;
};


pbSoldierDemo.prototype.restart = function()
{
	console.log("pbSoldierDemo.restart");
	
	this.destroy();
	this.create();
};


pbSoldierDemo.prototype.addSprites = function(num)
{
	// calculate cell position bounds in source texture and attach it to the image
	if (!this.surface)
	{
		var image = this.loader.getImage( this.spriteImg );
		this.surface = new pbSurface();
		this.surface.create(32, 64, 8, 5, image);
	}

	// create animation data and set destination for movement
	for( var i = 0; i < num; i++ )
	{
		// start from the top of the screen
		var x = Math.random() * this.renderer.width;
		var y = 0;

		// unique image holder per soldier (permits individual animation)
		var img = new pbImage();
		img.create(this.renderer, this.surface, Math.floor(Math.random() * 3));

		// unique sprite holder per soldier (holds transform)
		var spr = new pbSprite();
		spr.create(null, img, x, y, 1.0, 0, 96 / 480, 96 / 480);

		// TODO: add pbLayer system to manage layers of pbSprites
		// TODO: *maybe* add callback for pbSprite.update to implement AI functionality directly without needing unique objects for everything(?)
		// OR: create a demoSoldier object
		this.spriteList.push(
		{
			sprite: spr,
			tx: this.targetx,
			ty: this.targety,
		} );

		// line up in ranks getting smaller and smaller
		var finalScale = (this.targety + 96) / 480;
		this.targetx += img.surface.cellWide * 0.65 * finalScale;
		if (this.targetx >= 800 + img.surface.image.width * 0.5 * finalScale)
		{
			this.targetx = -img.surface.image.width * 0.5 * finalScale;
			this.targety -= img.surface.cellHigh * 0.15 * finalScale;
		}
	}
	this.numSprites = this.spriteList.length;
};


pbSoldierDemo.prototype.removeSprites = function(num)
{
	for( var i = 0; i < num; i++ )
	{
		if (this.spriteList.length > 0)
		{
			var spr = this.spriteList[this.spriteList.length - 1];
			this.targetx = spr.tx;
			this.targety = spr.ty;
		}

		this.spriteList.pop();
	}
	this.numSprites = this.spriteList.length;
};


pbSoldierDemo.prototype.update = function()
{
	frameCount++;

	// marching sprites
	var list = this.spriteList;
	if (list)
	{
		for ( var i = -1, l = list.length; ++i < l; )
		{
			var spr = list[i].sprite;
			var img = spr.image;

			// animation
			img.cellFrame += 0.2;
			if (img.cellFrame >= 8) img.cellFrame = 0;

			// movement towards target location
			var dx = list[i].tx - spr.x;
			var dy = list[i].ty - spr.y;
			var dist = Math.sqrt(dx * dx + dy * dy);
			if (dist > 0.1)
			{
				spr.x += dx / dist;
				spr.y += dy / dist;
				spr.z = 1 - spr.y / 480;
				spr.scaleX = spr.scaleY = (spr.y + 96) / 480;
			}

			// rotation test
			//spr.angleInRadians += 0.02 * Math.random();


			// TODO: pbLayer should handle calls to pbSprite.update for all sprites in that layer (equivalent to Stage.update)
			spr.update();

			// if (!this.useBatch)
			// 	this.renderer.graphics.drawImage( list[ i ].x, list[ i ].y, list[ i ].z, list[ i ].img, list[ i ].cellFrame, list[ i ].angle, list[i].scale );
		}
		
		// batch draw them all with a single image texture
		// if (this.useBatch && this.numSprites > 0)
		// 	this.renderer.graphics.batchDrawImages( this.spriteList, this.spriteList[ 0 ].img );
	}

	if (fps > 59 && this.targety > 0)
	{
	 	this.addSprites(2);
	}
	if (fps > 0 && fps < 55)
	{
	 	this.removeSprites(1);
	}
};

