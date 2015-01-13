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

	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );
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

	this.surface.destroy();
	this.surface = null;

	this.renderer.destroy();
	this.renderer = null;
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

	this.cameraZoom = 1.0;
	this.cameraDirZ = 0.01;
	
	// create animation data and set destination for movement
	var image = this.loader.getImage( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, image);

	var img = new pbImage();
	img.create(this.renderer, this.surface, 0);

	this.dirx = 2;
	this.spr = new pbSprite();
	this.spr.create(img, 200, 200, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.spr);

	this.child = new pbSprite();
	this.child.create(img, 0, -100, 1.0, 0, 0.75, 0.75);
	this.spr.addChild(this.child);

	this.childchild = new pbSprite();
	this.childchild.create(img, 0, -75, 1.0, 0, 0.75, 0.75);
	this.child.addChild(this.childchild);

	var childchildchild = new pbSprite();
	childchildchild.create(img, 0, -50, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);

	childchildchild = new pbSprite();
	childchildchild.create(img, 0, 50, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);

	childchildchild = new pbSprite();
	childchildchild.create(img, -50, 0, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);

	childchildchild = new pbSprite();
	childchildchild.create(img, 50, 0, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);
};


pbTransformDemo.prototype.update = function()
{
	frameCount++;

	// zoom the camera (rootLayer) in and out
	this.cameraZoom += this.cameraDirZ;
	if (this.cameraZoom < 0.5 || this.cameraZoom > 2.0) this.cameraDirZ = -this.cameraDirZ;
	rootLayer.scaleX = rootLayer.scaleY = this.cameraZoom;

	// make the first three depths rotate at different speeds
	this.childchild.angleInRadians += 0.04;
	this.child.angleInRadians += 0.02;
	this.spr.angleInRadians += 0.01;

	// bounce the top sprite across the renderer view
	this.spr.x += this.dirx;
	if (this.spr.x < 150) this.dirx = -this.dirx;
	if (this.spr.x > this.renderer.width - 150) this.dirx = -this.dirx;
};

