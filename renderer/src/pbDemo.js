/**
 *
 * A demo framework to hold tests for the replacement Phaser renderer.
 *
 * NOTE: use of the 'pb' prefix on all classes in this test bed is essential.  It permits renaming of all class references without ambiguity.
 * During development it is expected that class names, hierarchies and inter-relationships will change frequently as we feel our way to the ideal structure.
 *
 */



var frameCount = 0;


// created while the data is loading (preloader)
function pbDemo( docId )
{
	console.log( "pbDemo c'tor entry" );

	var _this = this;

	this.docId = docId;
	this.loadFlag = false;
	this.bootFlag = false;

	// dat.GUI controlled variables and callbacks
	this.useBatch = true;
	this.numSprites = 0;
	var gui = new dat.GUI();
	var numCtrl = gui.add(this, "numSprites").min(0).max(MAX_SPRITES).step(250).listen();
	numCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });
	var btcCtrl = gui.add(this, "useBatch");
	btcCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/soldier_a_run.png" );
//	this.spriteImg = this.loader.loadImage( "../img/pete64.png" );
//	this.spriteImg = this.loader.loadImage( "../img/sphere3.png" );
//	

	// callback for when the loading is complete (shouldn't happen until all the pbLoader stuff has finished, but pbLoader callback makes it bullet-proof - may be unnecessary)
	window.onload = function( e )
	{
		_this.boot.call( _this );
	};

	console.log( "pbDemo c'tor exit" );
}


pbDemo.prototype.boot = function()
{
	console.log( "pbDemo.boot" );

	if ( this.loadFlag )
	{
		this.renderer = new pbRenderer( this.docId, this.update, this );
		this.init(); // TODO: dodgy calling this after the renderer sets update!
	}
	this.bootFlag = true;
};


pbDemo.prototype.allLoaded = function()
{
	console.log( "pbDemo.allLoaded" );

	if ( this.bootFlag )
	{
		this.renderer = new pbRenderer( this.docId, this.update, this );
		this.init(); // TODO: dodgy calling this after the renderer sets update!
	}
	this.loadFlag = true;
};


pbDemo.prototype.init = function()
{
	console.log( "pbDemo.init" );

	// calculate cell position bounds in source texture and attach it to the image
	var img = this.loader.getImage( this.spriteImg );
	this.createCellData(img, 32, 64, 8, 5);

	this.create();
};


pbDemo.prototype.create = function()
{
	console.log("pbDemo.create");

	this.targetx = 0;
	this.targety = 460;
	this.depth = 1;

	this.spriteList = [];
};


pbDemo.prototype.destroy = function()
{
	console.log("pbDemo.destroy");

	this.spriteList = null;
	this.renderer.graphics.reset();
};


pbDemo.prototype.restart = function()
{
	console.log("pbDemo.restart");
	
	this.destroy();
	this.create();
};


// I'm using the term 'cell' in place of 'frame' for animation... avoids ambiguity with 'frame' as a measure of time (frames per second, etc)
pbDemo.prototype.createCellData = function(img, cellWide, cellHigh, cellsWide, cellsHigh)
{
	// TODO: move the cell information into pbImage, work out a suitable animation system to store the cellTextureBounds array
	img.cellWide = cellWide;
	img.cellHigh = cellHigh;
	img.cellsWide = cellsWide;
	img.cellsHigh = cellsHigh;
	img.padRight = img.width - img.cellWide * img.cellsWide;
	img.padBottom = img.height - img.cellHigh * img.cellsHigh;
	img.cellTextureBounds = [];

	// dimensions of one cell in texture coordinates (0 = left/top, 1 = right/bottom)
	var texWide = 1.0 / (img.width / img.cellWide);
	var texHigh = 1.0 / (img.height / img.cellHigh);

	for(var x = 0; x < cellsWide; x++)
	{
		img.cellTextureBounds[x] = [];
		for(var y = 0; y < cellsHigh; y++)
			img.cellTextureBounds[x][y] = new pbRectangle(x * texWide, y * texHigh, texWide, texHigh);
	}
};


pbDemo.prototype.addSprites = function(num)
{
	// create animation data and set destination for movement
	var surface = this.loader.getImage( this.spriteImg );

	for( var i = 0; i < num; i++ )
	{
		// start from the top of the screen
		var x = Math.random() * this.renderer.width;
		var y = 0;

		// unique image holder per soldier (permits individual animation)
		var img = new pbImage();
		img.create(this.renderer, surface, Math.floor(Math.random() * 3));

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
		if (this.targetx >= 800 + img.surface.width * 0.5 * finalScale)
		{
			this.targetx = -img.surface.width * 0.5 * finalScale;
			this.targety -= img.surface.cellHigh * 0.15 * finalScale;
		}
	}
	this.numSprites = this.spriteList.length;
};


pbDemo.prototype.removeSprites = function(num)
{
	for( var i = 0; i < num; i++ )
	{
		this.spriteList.pop();
	}
	this.numSprites = this.spriteList.length;
};


pbDemo.prototype.update = function()
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

			spr.angleInRadians += 0.02 * Math.random();


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
	 	this.addSprites(50);
	}
	if (fps > 0 && fps < 55)
	{
	 	this.removeSprites(10);
	}
};

