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
	this.value = undefined;

	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );

	console.log( "pbCanvasToGlDemo c'tor exit" );
}


pbCanvasToGlDemo.prototype.create = function()
{
	console.log("pbCanvasToGlDemo.create");

	// create a new div to put the canvases in so we can see their contents outside of the webGl window
	this.div = document.createElement('div');
	this.div.id = 'canvasDiv';
	document.body.appendChild(this.div);

	// make the source canvas with an initial text element
	// this canvas will be copied to a webGl texture
	this.canvasSrc = document.createElement('canvas');
	this.canvasSrc.width = 300;
	this.canvasSrc.height = 100;
	this.canvasSrc.style.border = "1px solid";
	this.canvasSrc.id = "canvasSrc";
	this.ctxSrc = this.canvasSrc.getContext("2d");
	this.ctxSrc.font = "bold 100px Arial";
	this.ctxSrc.fillStyle = "#ffffff";
	this.ctxSrc.fillText("-", 150, 90, 300);
	this.ctxSrc.textAlign = "center";

	// make the destination canvas that the webGl texture will be copied back to
	this.canvasDst = document.createElement('canvas');
	this.canvasDst.width = 300;
	this.canvasDst.height = 100;
	this.canvasDst.style.border = "1px solid";
	this.canvasDst.id = "canvasDst";
	this.ctxDst = this.canvasDst.getContext("2d");
	this.ctxDst.fillStyle = "#ffffff";
	this.ctxDst.fillRect(0, 0, 300, 100);

	// append the canvases to the new div
	this.div.appendChild(this.canvasSrc);
	this.div.appendChild(this.canvasDst);

	// initialise the demo variables
	this.x = 150;
	this.y = 50;
	this.angleInRadians = 0;
	this.scaleX = 1;
	this.scaleY = 1;

	// prepare the webGl texture transform matrix
	this.transform = pbMatrix3.makeTransform(this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY);
};


pbCanvasToGlDemo.prototype.destroy = function()
{
	console.log("pbCanvasToGlDemo.destroy");

	// TODO: destroy div, canvases, and clean up afterwards

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
	// update the counter and use it to occasionally change the displayed value
	this.count++;
	var last = this.value;
	this.value = Math.floor(this.count / 60);

	// redraw the source canvas every frame
	this.ctxSrc.fillStyle = "rgb(" + (this.count & 0xff) + "," + ((this.count >> 4) & 0xff) + ", 0)";
	this.ctxSrc.fillRect(0, 0, 300, 100);
	this.ctxSrc.fillStyle = "#ffffff";
	this.ctxSrc.fillText(this.value, 150, 90, 300);

	// move the webGl texture around
	this.angleInRadians += 0.01;
	this.x = this.count % this.renderer.width;
	this.y = this.count % this.renderer.height;
	this.scaleY = this.scaleX = (this.count / 500) % 2;
	pbMatrix3.setTransform(this.transform, this.x, this.y, this.angleInRadians, this.scaleX, this.scaleY);

	// draw the canvas texture into a transformed webGl texture
	// it will be marked as 'dirty' only when the displayed value changes
	this.renderer.graphics.drawCanvasWithTransform(this.canvasSrc, (last !== this.value), this.transform, 1.0);

	// prepare the texture to be grabbed by attaching it to a frame buffer (once only)
	if (!this.renderer.graphics.canReadTexture)
		this.renderer.graphics.prepareTextureForCanvas();

	// grab the webGl.currentTexture and draw it into the destination canvas as ImageData
	this.renderer.graphics.getTextureToCanvas(this.ctxDst);
};

