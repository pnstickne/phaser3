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
	this.targety = 440;
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


pbDemo.prototype.createCellData = function(img, cellWide, cellHigh, cellsWide, cellsHigh)
{
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
	// create animation data
	var img = this.loader.getImage( this.spriteImg );
	for( var i = 0; i < num; i++ )
	{
		// line up in ranks getting smaller and smaller
		var finalScale = 2 * (this.targety + 24) / 480;
		this.targetx += img.cellWide * 0.75 * finalScale;
		if (this.targetx >= 640)
		{
			this.targetx = 0;
			this.targety -= img.cellHigh * 0.20 * finalScale;
			this.targets *= 0.985;
		}

//this.targetx = Math.random() * this.renderer.width;
//this.targety = Math.random() * (this.renderer.height - 24);

		// start from the top centre of the screen
		var x = 320;
		var y = 0;
		this.spriteList.push(
		{
			x: x,
			y: y,
			z: 1.0,
			tx: this.targetx,
			ty: this.targety,
			img: img,
			cell: Math.floor(Math.random() * 3),
			angle: 0,
			scale: 2 * 24 / 480
		} );
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
			// animation
			list[i].cell += 0.1;
			if (list[i].cell >= 8) list[i].cell = 0;

			// movement towards target location
			var dx = list[i].tx - list[i].x;
			var dy = list[i].ty - list[i].y;
			var dist = Math.sqrt(dx * dx + dy * dy);
			if (dist > 0.1)
			{
				list[i].x += dx / dist;
				list[i].y += dy / dist;
				list[i].z = 1 - list[i].y / 480;
				list[i].scale = 2 * (list[i].y + 24) / 480;
			}

			if (!this.useBatch)
				this.renderer.graphics.drawImage( list[ i ].x, list[ i ].y, list[ i ].img, list[ i ].angle, list[i].scale );
		}
		
		// batch draw them all with a single image texture
		if (this.useBatch && this.numSprites > 0)
			this.renderer.graphics.batchDrawImages( this.spriteList, this.spriteList[ 0 ].img );
	}

	if (fps > 59)
	{
	 	this.addSprites(5);
	}
	if (fps > 0 && fps < 55)
	{
	 	this.removeSprites(1);
	}
};