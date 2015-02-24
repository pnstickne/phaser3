/**
 *
 * The transform hierarchy demo for the new Phaser 3 renderer.
 *
 */



// created while the data is loading (preloader)
function pbTransformDemo( docId )
{
	console.log( "pbTransformDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/sphere3.png" );

	console.log( "pbTransformDemo c'tor exit" );
}


pbTransformDemo.prototype.allLoaded = function()
{
	console.log( "pbTransformDemo.allLoaded" );

	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbTransformDemo.prototype.create = function()
{
	console.log("pbTransformDemo.create");

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

	// create animation data and set destination for movement
	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, image);

	var img = new imageClass();
	img.create(this.surface, 0, 0.5, 1.0);		// anchorY = 1.0 - make movement appear more complex

	this.dirx = 2;
	this.spr = new pbSprite();
	this.spr.create(img, 200, 200, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.spr);

	this.child = new pbSprite();
	this.child.create(img, 0, -75, 1.0, 0, 0.75, 0.75);
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
	// make the first three depths rotate at different speeds
	this.childchild.angleInRadians += 0.04;
	this.child.angleInRadians += 0.02;
	this.spr.angleInRadians += 0.01;

	// bounce the top sprite across the renderer view
	this.spr.x += this.dirx;
	if (this.spr.x < 150) this.dirx = -this.dirx;
	if (this.spr.x > pbRenderer.width - 150) this.dirx = -this.dirx;
};

