/**
 *
 * Empty demo file, loads a texture and sets up the renderer...
 *
 */



// created while the data is loading (preloader)
function pbGraphicsDemo( docId )
{
	console.log( "pbGraphicsDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );

	console.log( "pbGraphicsDemo c'tor exit" );
}


pbGraphicsDemo.prototype.create = function()
{
	console.log("pbGraphicsDemo.create");

};


pbGraphicsDemo.prototype.destroy = function()
{
	console.log("pbGraphicsDemo.destroy");

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;
};


pbGraphicsDemo.prototype.restart = function()
{
	console.log("pbGraphicsDemo.restart");
	
	this.destroy();
	this.create();
};


pbGraphicsDemo.prototype.update = function()
{
   	// debug box
   	this.renderer.graphics.drawRect(pbRenderer.width / 2, pbRenderer.height / 4, 100, 75, {r:0xff, g:0xff, b:0xff, a:0xff});
   	this.renderer.graphics.fillRect(pbRenderer.width / 2, pbRenderer.height / 4 * 3, 100, 75, {r:0xff, g:0xff, b:0xff, a:0xff});
};

