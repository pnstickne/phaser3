
function pbBackground()
{
}


pbBackground.prototype.create = function(_parent, _rootLayer)
{
	console.log("pbBackground.create");

	this.rootLayer = _rootLayer;

	// background
	if (textures.exists("bg"))
		this.bg = new pbSprite(0, 0, "bg", this.rootLayer);
};


pbBackground.prototype.destroy = function()
{
	console.log("pbBackground.destroy");

	if (this.bg)
		this.bg.destroy();
	this.bg = null;
};


