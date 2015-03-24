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
	this.srcImage = null;
	this.renderSurface = null;
	this.displayLayer = null;
	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;
	this.filterTexture = null;

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

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
	this.filterTexture = null;
};


pbRenderTextureDemo.prototype.restart = function()
{
	console.log("pbRenderTextureDemo.restart");
	
	this.destroy();
	this.create();
};


pbRenderTextureDemo.prototype.addSprites = function()
{
	console.log("pbRenderTextureDemo.addSprites");

	var image = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	// _wide, _high, _numWide, _numHigh, _image
	this.surface.create(0, 0, 1, 1, image);

	this.srcImage = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	this.srcImage.create(this.surface, 0, 0, 0);
};


pbRenderTextureDemo.prototype.initTexture = function(_textureRegister, _width, _height)
{
	// create an empty texture to draw to, which matches the display dimensions
	var texture = gl.createTexture();
    texture.width = _width;
    texture.height = _height;
    gl.activeTexture(_textureRegister);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	return texture;
}


pbRenderTextureDemo.prototype.initDepth = function(_texture)
{
	// create a 'render-to' depth buffer
    var depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _texture.width, _texture.height);
    return depth;
};


pbRenderTextureDemo.prototype.initFramebuffer = function(_texture, _depth)
{
    // attach the render-to-texture to a new framebuffer
	var fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, _texture, 0);
    // attach the depth buffer to the framebuffer
    if (_depth)
    	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, _depth);

    return fb;
};


pbRenderTextureDemo.prototype.drawSceneToTexture = function(_fb)
{
	// bind the framebuffer so drawing will go to the associated texture and depth buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);
	// clear the render-to-texture using a varying green shade to make it stand out
	gl.clearColor(0, (pbRenderer.frameCount % 100 / 100), 0, 1); // green shades
	gl.clear(gl.COLOR_BUFFER_BIT);
	// draw this.srcImage into the render-to-texture
	this.renderer.graphics.drawImageWithTransform(this.srcImage, this.srcTransform, 1.0);
};


pbRenderTextureDemo.prototype.update = function()
{
	if (this.firstTime)
	{
		// create the render-to-texture, depth buffer, and a frame buffer to hold them
		this.rttTexture = this.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
		this.rttRenderbuffer = this.initDepth(this.rttTexture);
		this.rttFramebuffer = this.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

		// create the filter texture
		this.filterTexture = this.initTexture(gl.TEXTURE1, pbRenderer.width, pbRenderer.height);
		this.filterFramebuffer = this.initFramebuffer(this.filterTexture, null);

		// set the transformation for rendering to the render-to-texture
		this.srcTransform = pbMatrix3.makeTransform(10, 10, 0, 1, 1);
		this.dstTransform = pbMatrix3.makeTransform(0, 0, 0, 1, 0);

	    // clear the gl bindings
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	    gl.bindTexture(gl.TEXTURE_2D, null);
	    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// don't do this again...
		this.firstTime = false;
	}

	// draw srcImage using the render-to-texture framebuffer
	this.drawSceneToTexture(this.rttFramebuffer);

	//
	// apply a filter as we transfer the texture from rttTexture to filterTexture
	//
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	// clear the render-to-texture using a varying blue shade to make it stand out
	gl.clearColor(0, 0, 1.0 - (pbRenderer.frameCount % 100 / 100), 1); // blue shades
	gl.clear(gl.COLOR_BUFFER_BIT);
	// copy the rttTexture to the filterTexture applying a filter as it draws
	this.renderer.graphics.applyFilterToTexture(0, this.rttTexture);

	// draw the filter texture to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(this.filterTexture);

	// draw the render-to-texture to the display
//	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//	this.renderer.graphics.drawTextureToDisplay(this.rttTexture);
};

