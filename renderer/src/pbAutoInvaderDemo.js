/**
 *
 * The auto-invaders demo for the new Phaser 3 renderer.
 *
 */



// created while the data is loading (preloader)
function pbAutoInvaderDemo( docId )
{
	console.log( "pbAutoInvaderDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.playerImg = this.loader.loadImage( "../img/invader/player.png" );
	this.invaderImg = this.loader.loadImage( "../img/invader/invader32x32x4.png" );
	this.saucerImg = this.loader.loadImage( "../img/invader/invader.png" );
	this.starsImg = this.loader.loadImage( "../img/invader/starfield.png" );
	this.bulletImg = this.loader.loadImage( "../img/invader/bullet.png" );
	this.bombImg = this.loader.loadImage( "../img/invader/enemy-bullet.png" );
	this.explosionImg = this.loader.loadImage( "../img/invader/explode.png" );

	console.log( "pbAutoInvaderDemo c'tor exit" );
}


pbAutoInvaderDemo.prototype.allLoaded = function()
{
	console.log( "pbAutoInvaderDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );
};


pbAutoInvaderDemo.prototype.create = function()
{
	console.log("pbAutoInvaderDemo.create");

	this.addSprites();
};


pbAutoInvaderDemo.prototype.destroy = function()
{
	console.log("pbAutoInvaderDemo.destroy");

	this.bgSurface.destroy();
	this.bgSurface = null;

	this.renderer.destroy();
	this.renderer = null;
};


pbAutoInvaderDemo.prototype.restart = function()
{
	console.log("pbAutoInvaderDemo.restart");
	
	this.destroy();
	this.create();
};


pbAutoInvaderDemo.prototype.addSprites = function()
{
	console.log("pbAutoInvaderDemo.addSprites");

	// background
	var image = this.loader.getImage( this.starsImg );
	this.bgSurface = new pbSurface();
	this.bgSurface.create(0, 0, 1, 1, image);
	this.bgImage = new pbImage();
	this.bgImage.create(this.renderer, this.bgSurface, 0, 0.5, 0.5);	//, true, true);
	this.bg = new pbSprite();
	this.bg.create(this.bgImage, 0, 0, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.bg);

};


pbAutoInvaderDemo.prototype.update = function()
{

};

