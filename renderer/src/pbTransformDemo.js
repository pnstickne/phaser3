/**
 *
 * The soldier marching (pseudo-3d) demo for the new Phaser 3 renderer.
 *
 */



var frameCount = 0;


// created while the data is loading (preloader)
function pbTransformDemo( docId )
{
	console.log( "pbTransformDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// // dat.GUI controlled variables and callbacks
	// this.useBatch = true;
	// this.numSprites = 0;
	// var gui = new dat.GUI();
	// var numCtrl = gui.add(this, "numSprites").min(0).max(MAX_SPRITES).step(250).listen();
	// numCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });
	// var btcCtrl = gui.add(this, "useBatch");
	// btcCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/sphere3.png" );

	console.log( "pbTransformDemo c'tor exit" );
}


pbTransformDemo.prototype.allLoaded = function()
{
	console.log( "pbTransformDemo.allLoaded" );

	this.renderer = new pbRenderer( this.docId, this.update, this );
	this.init();
};


pbTransformDemo.prototype.init = function()
{
	console.log( "pbTransformDemo.init" );

	// calculate cell position bounds in source texture and attach it to the image
	var img = this.loader.getImage( this.spriteImg );

	this.create();
};


pbTransformDemo.prototype.create = function()
{
	console.log("pbTransformDemo.create");

	this.targetx = 0;
	this.targety = 460;
	this.depth = 1;

	this.addSprites();
};


pbTransformDemo.prototype.destroy = function()
{
	console.log("pbTransformDemo.destroy");

	this.spriteList = null;
	if (this.renderer && this.renderer.graphics)
		this.renderer.graphics.reset();
};


pbTransformDemo.prototype.restart = function()
{
	console.log("pbTransformDemo.restart");
	
	this.destroy();
	this.create();
};


pbTransformDemo.prototype.addSprites = function()
{
	console.log("pbTransformDemo.addSprites");
	
	// create animation data and set destination for movement
	var image = this.loader.getImage( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, image);

	var img = new pbImage();
	img.create(this.renderer, this.surface, 0);

	this.spr = new pbSprite();
	this.spr.create(null, img, 200, 200, 1.0, 0, 1.0, 1.0);

	this.child = new pbSprite();
	this.child.create(this.spr, img, 0, -50, 1.0, 0, 0.5, 0.5);
};


pbTransformDemo.prototype.update = function()
{
	frameCount++;

	this.spr.angleInRadians += 0.01;
	this.spr.update();
};

