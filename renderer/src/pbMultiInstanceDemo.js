/**
 *
 * pbMultiInstanceDemo.js - example to illustrate the use of multiple cameras simultaneously
 *
 * 
 */


function pbMultiInstanceDemo( docId )
{
	console.log( "pbMultiInstanceDemo c'tor entry" );

	var _this = this;
	this.docId = docId;
	
	this.layer = null;
	this.cameras = null;
	this.fps60 = 0;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.playerImg = this.loader.loadImage( "../img/invader/player.png" );
	this.invaderImg = this.loader.loadImage( "../img/invader/invader32x32x4.png" );
	this.saucerImg = this.loader.loadImage( "../img/invader/invader.png" );
	this.starsImg = this.loader.loadImage( "../img/invader/starfield.png" );
	this.bulletImg = this.loader.loadImage( "../img/invader/bullet.png" );
	this.bombImg = this.loader.loadImage( "../img/invader/enemy-bullet.png" );
	this.rocketImg = this.loader.loadImage( "../img/invader/rockets32x32x8.png" );
	this.smokeImg = this.loader.loadImage( "../img/invader/smoke64x64x8.png" );
	this.explosionImg = this.loader.loadImage( "../img/invader/explode.png" );
	this.fontImg = this.loader.loadImage( "../img/fonts/arcadeFonts/16x16/Bubble Memories (Taito).png" );

	console.log( "pbMultiInstanceDemo c'tor exit" );
}


pbMultiInstanceDemo.prototype.allLoaded = function()
{
	console.log( "pbMultiInstanceDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbMultiInstanceDemo.prototype.create = function()
{
	this.numWide = 1;
	this.numHigh = 1;
	this.addCameras();
};


pbMultiInstanceDemo.prototype.addCameras = function()
{
	var cx = 0;
	var cy = 0;
	var tx = this.renderer.width / this.numWide;
	var ty = this.renderer.height / this.numHigh;

	this.cameras = [];
	for(var y = 0; y < this.numHigh; y++)
	{
		if (!this.cameras[y])
			this.cameras[y] = [];

		for(var x = 0; x < this.numWide; x++)
		{
			// add a new camera
			var layer = new pbWebGlLayer();
			layer.create(rootLayer, this.renderer, cx, cy, 0, 0, 1 / this.numWide, 1 / this.numHigh);
			layer.setClipping(cx, cy, tx, ty);
			this.cameras[y][x] = new pbInvaderDemoCore();
			this.cameras[y][x].create(this, layer);
			rootLayer.addChild(layer);

			cx += tx;
		}
		cx = 0;
		cy += ty;
	}
};


pbMultiInstanceDemo.prototype.removeCameras = function()
{
	for(var y = 0; y < this.numHigh; y++)
	{
		for(var x = 0; x < this.numWide; x++)
		{
			this.cameras[y][x].layer.destroy();
			this.cameras[y][x].destroy();
		}
		this.cameras[y] = null;
	}
	this.cameras = null;
};


pbMultiInstanceDemo.prototype.destroy = function()
{
	this.removeCameras();

	this.renderer.destroy();
	this.renderer = null;
};


pbMultiInstanceDemo.prototype.update = function()
{
	var y = this.numHigh;
	while(y--)
	{
		var x = this.numWide;
		while(x--)
			this.cameras[y][x].update();
	}

	if (fps >= 60)
		this.fps60++;
	else
		this.fps60 = 0;

	if (this.fps60 > 60 * 5)
	{
		this.fps60 = 0;
		this.removeCameras();

		if (this.numWide <= this.numHigh)
			this.numWide++;
		else
			this.numHigh++;

		this.addCameras();
	}
};








