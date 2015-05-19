/**
 *
 * The auto-invaders demo core for the new Phaser 3 renderer.
 *
 */


/* jshint laxbreak: true */	// tell jshint to just shut-up already about my choice of line format



// created while the data is loading (preloader)
function pbBackground()
{
	console.log( "pbBackground c'tor entry" );

	this.layer = null;
}


pbBackground.prototype.create = function(_parent, _rootLayer)
{
	console.log("pbBackground.create");

	this.layer = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.layer.create(_parent, _parent.renderer, 0, 0, 0, 0, 1, 1);
	_rootLayer.addChild(this.layer);

	this.addSprites();
};


pbBackground.prototype.destroy = function()
{
	console.log("pbBackground.destroy");

	if (this.text)
		this.text.destroy();
	this.text = null;

	if (this.layer)
		this.layer.destroy();
	this.layer = null;
};


pbBackground.prototype.addSprites = function()
{
	console.log("pbBackground.addSprites");

	var imageData;

	// background
	if (textures.exists("stars"))
	{
		this.bg = new pbSprite(0, 0, "stars", this.layer);
		this.bg.fullScreen = true;
		this.bg.tiling = true;
	}
};


