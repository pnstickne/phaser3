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
	this.useBatch = false;
	this.numBalls = 200;
	this.growthRate = 50;
	var gui = new dat.GUI();
	var numCtrl = gui.add(this, "numBalls").min(0).max(MAX_SPRITES).step(250).listen();
	numCtrl.onFinishChange(function(value) { _this.restart(); });
	var btcCtrl = gui.add(this, "useBatch");
	btcCtrl.onFinishChange(function(value) { if (!value) _this.numBalls = 200; _this.restart(); });

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.loaded, this );
	this.imgBall = this.loader.loadImage( "../img/sphere3.png" );

	// callback for when the loading is complete (shouldn't happen until all the pbLoader stuff has finished, but pbLoader callback makes it bullet-proof - may be unnecessary)
	window.onload = function( e )
	{
		_this.boot.call( _this );
	};

	console.log( "pbDemo c'tor exit" );
}


pbDemo.prototype.loaded = function()
{
	console.log( "pbDemo.loaded" );

	if ( this.bootFlag )
	{
		this.renderer = new pbRenderer( this.docId, this.update, this );
		this.init(); // TODO: dodgy calling this after the renderer sets update!
	}
	this.loadFlag = true;
};


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


pbDemo.prototype.init = function()
{
	console.log( "pbDemo.init" );

	this.create();
};


pbDemo.prototype.create = function()
{
	console.log("pbDemo.create");

	this.spriteList = [];
	this.addBalls(this.numBalls);
};


pbDemo.prototype.addBalls = function(num)
{
	for( var i = 0; i < num; i++ )
	{
		var x = Math.random() * 640;
		var y = Math.random() * 480;
		this.spriteList.push(
		{
			x: x,
			y: y,
			vx: Math.random() * 4 - 2,
			vy: Math.random() * 4 - 2,
			img: this.loader.getImage( this.imgBall )
		} );
	}
	this.numBalls = this.spriteList.length;
};


pbDemo.prototype.removeBalls = function(num)
{
	for( var i = 0; i < num; i++ )
	{
		this.spriteList.pop();
	}
	this.numBalls = this.spriteList.length;
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


pbDemo.prototype.update = function()
{
	frameCount++;

	// bouncing balls!
	var list = this.spriteList;
	if (list)
	{
		for ( var i = -1, l = list.length; ++i < l; )
		{
			list[ i ].x += list[ i ].vx;
			if ( list[ i ].x < 0 || list[ i ].x > 640 ) list[ i ].vx *= -1;
			list[ i ].y += list[ i ].vy;
			if ( list[ i ].y < 0 || list[ i ].y > 480 ) list[ i ].vy *= -1;

			if (!this.useBatch)
				this.renderer.graphics.drawImage( list[ i ].x, list[ i ].y, list[ i ].img );
		}
		
		// batch draw them all with a single image texture
		// TODO: send a spriteSheet and animate from within it
		if (this.useBatch)
			this.renderer.graphics.batchDrawImages( this.spriteList, this.spriteList[ 0 ].img );
	}

	if ((frameCount & 63) === 0)
	{
		if (fps > 55)
		{
			this.addBalls(this.growthRate);
			this.growthRate += 100;
		}
		if (fps > 0 && fps < 50)
		{
			this.removeBalls(200);
			this.growthRate = 50;
		}
	}

	// show fps with a moving white square's vertical position (and confirm that the shader programs can switch from 'image' to 'graphics')
	//	var x = this.renderer.frameCount % canvas.width;
	//	this.renderer.graphics.fillStyle( "#FFF" );
	//	this.renderer.graphics.fillRect( x, this.renderer.rootTimer.elapsedTime, 4, 4 );
};