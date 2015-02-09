/**
 *
 * Demo showing use of the canvas to webgl API functions.
 *
 */



// created while the data is loading (preloader)
function pbCanvasToGlDemo( docId )
{
	console.log( "pbCanvasToGlDemo c'tor entry" );

	var _this = this;
	this.docId = docId;
	this.count = 0;

	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );

	console.log( "pbCanvasToGlDemo c'tor exit" );
}


pbCanvasToGlDemo.prototype.create = function()
{
	console.log("pbCanvasToGlDemo.create");

	// make the canvas with an initial text element
	this.canvas = document.createElement('canvas');
	this.canvas.width = 300;
	this.canvas.height = 100;
	this.canvas.style.border = "1px solid";
	this.canvas.id = "canvas";
	this.ctx = this.canvas.getContext("2d");
	this.ctx.font = "bold 100px Arial";
	this.ctx.fillStyle = "#ffffff";
	this.ctx.fillText("-", 150, 90, 300);
	this.ctx.textAlign = "center";
	// append the canvas to the body so we can see the canvas contents off to the side of the webGl window
	var body = document.getElementsByTagName("body")[0];
	body.appendChild(this.canvas);

	this.x = 150;
	this.y = 50;
	this.angleInRadians = 0;
	this.scaleX = 1;
	this.scaleY = 1;

	this.transform = pbMatrix3.makeTransform(this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY);
};


pbCanvasToGlDemo.prototype.destroy = function()
{
	console.log("pbCanvasToGlDemo.destroy");

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;
};


pbCanvasToGlDemo.prototype.restart = function()
{
	console.log("pbCanvasToGlDemo.restart");
	
	this.destroy();
	this.create();
};


pbCanvasToGlDemo.prototype.update = function()
{
	// update the counter
	this.count++;

	// redraw the canvas text
	this.ctx.fillStyle = "rgb(" + (this.count & 0xff) + "," + ((this.count >> 4) & 0xff) + ", 0)";
	this.ctx.fillRect(0, 0, 300, 100);
	this.ctx.fillStyle = "#ffffff";
	this.ctx.fillText(Math.floor(this.count / 10), 150, 90, 300);

	// move the webGl texture around
	this.angleInRadians += 0.01;
	this.x = this.count % this.renderer.width;
	this.y = this.count % this.renderer.height;
	this.scaleY = this.scaleX = (this.count / 500) % 2;
	pbMatrix3.setTransform(this.transform, this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY);

	// draw the canvas texture into a transformed webGl texture
	this.renderer.graphics.drawCanvasWithTransform(this.canvas, this.transform, 1.0);
};

