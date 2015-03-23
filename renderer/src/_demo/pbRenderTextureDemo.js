/**
 *
 * A render-to-texture demo for the new Phaser 3 renderer.
 *
 */



// created while the data is loading (preloader)
function pbRenderTextureDemo( docId )
{
	console.log( "pbRenderTextureDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.firstTime = true;
	this.surface = null;
	this.layer = null;
	this.renderSurface = null;
	this.displayLayer = null;
	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/screen1.jpg" );

	console.log( "pbRenderTextureDemo c'tor exit" );
}


pbRenderTextureDemo.prototype.allLoaded = function()
{
	console.log( "pbRenderTextureDemo.allLoaded" );

	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbRenderTextureDemo.prototype.create = function()
{
	console.log("pbRenderTextureDemo.create");

	this.addSprites();
};


pbRenderTextureDemo.prototype.destroy = function()
{
	console.log("pbRenderTextureDemo.destroy");

	this.surface.destroy();
	this.surface = null;

	this.renderer.destroy();
	this.renderer = null;
};


pbRenderTextureDemo.prototype.restart = function()
{
	console.log("pbRenderTextureDemo.restart");
	
	this.destroy();
	this.create();
};

var srcImage;

pbRenderTextureDemo.prototype.addSprites = function()
{
	console.log("pbRenderTextureDemo.addSprites");

	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	// _wide, _high, _numWide, _numHigh, _image
	this.surface.create(0, 0, 1, 1, image);

	srcImage = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	srcImage.create(this.surface, 0, 0, 0);
};


pbRenderTextureDemo.prototype.initTextureFramebuffer = function()
{
	// create an empty texture to draw to which matches the display dimensions
	this.rttTexture = gl.createTexture();
    this.rttTexture.width = pbRenderer.width;
    this.rttTexture.height = pbRenderer.height;
	gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rttTexture.width, this.rttTexture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // attach the render-to-texture to a new framebuffer
	this.rttFramebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0);

	// create a 'render-to' depth buffer
    this.rttRenderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.rttRenderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.rttTexture.width, this.rttTexture.height);
    // attach the depth buffer to the framebuffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.rttRenderbuffer);

    // clear the gl bindings
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};


pbRenderTextureDemo.prototype.drawSceneToTexture = function()
{
	// bind the framebuffer so drawing will go to the associated texture and depth buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	// clear the render-to-texture using a varying green shade to make it stand out
	gl.clearColor(0, (pbRenderer.frameCount % 100 / 100), 0, 1); // green shades;
	gl.clear(gl.COLOR_BUFFER_BIT);
	// draw srcImage into the render-to-texture
	this.renderer.graphics.drawImageWithTransform(srcImage, this.srcTransform, 1.0);
};


pbRenderTextureDemo.prototype.update = function()
{
	if (this.firstTime)
	{
		// create the render-to-texture, depth buffer, and a frame buffer to hold them
		this.initTextureFramebuffer();

		// set the transformation for rendering to the render-to-texture
		this.srcTransform = pbMatrix3.makeTransform(10, 10, 0, 1, 1);
		this.dstTransform = pbMatrix3.makeTransform(0, 0, 0, 1, 0);

		// don't do this again...
		this.firstTime = false;
	}

	// draw srcImage to the render-to-texture
	this.drawSceneToTexture();

	// draw render-to-texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(this.rttTexture);
};

