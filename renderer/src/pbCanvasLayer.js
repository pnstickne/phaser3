/**
 *
 * pbCanvasLayer - Base class for Layers, contains one layer of multiple pbSprite objects.
 *
 */


function pbCanvasLayer()
{
	this.list = null;
	this.parent = null;
	this.renderer = null;
	this.clip = null;
}

// pbCanvasLayer extends from the pbBaseLayer prototype chain
// permits multiple levels of inheritance 	http://jsfiddle.net/ZWZP6/2/  
// improvement over original answer at 		http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript
pbCanvasLayer.prototype = new pbBaseLayer();
pbCanvasLayer.prototype.constructor = pbCanvasLayer;
pbCanvasLayer.prototype.__super__ = pbBaseLayer;


pbCanvasLayer.prototype.update = function()
{
	console.log("pbCanvasLayer.update");

	// call the pbBaseLayer update for this pbCanvasLayer to access the child hierarchy
	this.super(pbCanvasLayer, 'update');

	if (this.clip)
	{
		// apply clipping for this layer
		this.renderer.graphics.scissor(Math.floor(this.clip.x), Math.floor(this.clip.y), Math.ceil(this.clip.width), Math.ceil(this.clip.height));
	}
	else
	{
		// disable clipping for this layer
		this.renderer.graphics.scissor();
	}

	// draw all of the queued objects
	if (this.list && this.list.length > 0)
		this.draw(this.list);

	// call update for all members of this layer
	var i = this.list.length;
	while(i--)
	{
		var member = this.list[i];

		if (!member.update())
		{
			member.destroy();
			this.list.splice(i, 1);
		}
	}

	return true;
};
