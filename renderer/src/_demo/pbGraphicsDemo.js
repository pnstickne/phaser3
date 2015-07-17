/**
 *
 * Empty demo file, loads a texture and sets up the renderer...
 *
 */



// created while the data is loading (preloader)
function pbGraphicsDemo( docId )
{
	console.log( "pbGraphicsDemo c'tor entry" );

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( useRenderer, this.create, this.update, this );

	console.log( "pbGraphicsDemo c'tor exit" );
}


pbGraphicsDemo.prototype.create = function()
{
	console.log("pbGraphicsDemo.create");

	this.rttTextureNumber = 1;
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, pbPhaserRender.width, pbPhaserRender.height);
	this.rttFramebuffer = pbWebGlTextures.useFramebufferRenderbuffer(this.rttTexture);

	// set the renderer postUpdate callback to draw the render-to-texture surface from the GPU
    pbPhaserRender.renderer.postUpdate = this.postUpdate;

	// bouncing, scaling, spinning variables
	this.tx = 0;
	this.tdx = 3;
	this.ty = 300;
	this.tdy = 2;
	this.tr = 0;
	this.tdr = 0.01;
	this.ts = 0.7;
	this.tds = 0.001;
	// create a transform matrix to draw the camera
	this.transform = pbMatrix3.makeTransform(this.tx, this.ty, this.tr, this.ts, this.ts);
};


pbGraphicsDemo.prototype.destroy = function()
{
	console.log("pbGraphicsDemo.destroy");

	if (this.phaserRender)
		this.phaserRender.destroy();
	this.phaserRender = null;
};


pbGraphicsDemo.prototype.restart = function()
{
	console.log("pbGraphicsDemo.restart");
	
	this.destroy();
	this.create();
};


pbGraphicsDemo.prototype.update = function()
{
	// draw to the rtt texture

   	// debug box
   	pbPhaserRender.renderer.graphics.drawRect(pbPhaserRender.width / 2, pbPhaserRender.height / 4, 100, 75, {r:0xff, g:0xff, b:0xff, a:0xff});
   	pbPhaserRender.renderer.graphics.fillRect(pbPhaserRender.width / 2, pbPhaserRender.height / 4 * 3, 100, 75, {r:0xff, g:0xff, b:0xff, a:0xff});
};


pbGraphicsDemo.prototype.postUpdate = function()
{
	// move the camera around
	this.tx += this.tdx;
	if (this.tx <= 0 || this.tx >= pbPhaserRender.width) this.tdx = -this.tdx;
	this.ty += this.tdy;
	if (this.ty <= 0 || this.ty >= pbPhaserRender.height) this.tdy = -this.tdy;
	this.tr += this.tdr;
	if (this.tr >= Math.PI * 2.0) this.tr -= Math.PI * 2.0;
	this.ts += this.tds;
	if (this.ts <= 0.4 || this.ts >= 0.8) this.tds = -this.tds;
	this.transform = pbMatrix3.makeTransform(this.tx, this.ty, this.tr, this.ts, this.ts);

	// don't render to texture any more, render to the display instead
	pbWebGlTextures.cancelFramebuffer();

	// draw the texture containing the game image to the display
	// _texture, _transform, _z
	pbPhaserRender.renderer.graphics.drawTextureWithTransform( this.rttTexture, this.transform, 1.0 );
};
