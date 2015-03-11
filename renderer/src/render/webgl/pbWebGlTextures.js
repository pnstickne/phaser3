/**
 *
 * pbWebGlTextures.js - texture handler for the pbWebGl drawing functions
 * 
 */


function pbWebGlTextures()
{
	this.onGPU = null;
	this.fb = null;
	this.currentTexture = null;
	this.canReadTexture = false;
	this.rttFb = null;
	this.rtTexture = null;
	this.rtDepth = null;
}


pbWebGlTextures.prototype.create = function()
{
	this.onGPU = [];
	this.fb = null;
	this.currentTexture = null;
	this.canReadTexture = false;
	this.rttFb = null;
	this.rtTexture = null;
	this.rtDepth = null;
};


pbWebGlTextures.prototype.destroy = function()
{
	this.onGPU = null;
	this.fb = null;
	this.currentTexture = null;
	this.rttFb = null;
	this.rtTexture = null;
	this.rtDepth = null;
};


/**
 * prepare - prepare a texture for webGl rendering
 *
 * @param  {[type]} _image  [description]
 * @param  {[type]} _tiling [description]
 * @param  {[type]} _npot   [description]
 *
 * @return {Boolean} true if successfully prepared a new texture, false if failed or it was already prepared
 */
pbWebGlTextures.prototype.prepare = function( _image, _tiling, _npot )
{
	// this _image is already the selected texture
	if (this.currentTexture && this.currentTexture.image === _image)
		return false;

	var texture = null;

	var index = this.onGPU.indexOf(_image);
    if (index != -1)
    {
		// the _image is already on the GPU
		texture = this.onGPU[index].gpuTexture;
		// bind it to use it...
	    gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    else
    {
    	// upload it to the GPU
	    var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	    if (_image.width > maxSize || _image.height > maxSize)
	    {
		    alert("ERROR: Texture size not supported by this video card!", _image.width, _image.height, " > ", maxSize);
		    return false;
	    }

		console.log( "pbWebGlTextures.prepare uploading new texture : ", _image.width, "x", _image.height );

	    // link the texture object to the image and vice-versa
		texture = gl.createTexture();
		texture.image = _image;
		_image.gpuTexture = texture;

	    gl.bindTexture(gl.TEXTURE_2D, texture);
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _image);
	    if (_npot)
	    {
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	    }
	    else if (_tiling)
	    {
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		    gl.generateMipmap(gl.TEXTURE_2D);
	    }
    	else
    	{
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		    gl.generateMipmap(gl.TEXTURE_2D);
    	}

	    // remember that this texture has been uploaded
	    this.onGPU.push(_image);
	}

	// activate the texture
    this.currentTexture = texture;
    gl.activeTexture( gl.TEXTURE0 );

    return true;
};


/**
 * prepare - prepare a texture for webGl to render to it, leave it bound to the framebuffer so everything will go there
 *
 */
pbWebGlTextures.prototype.prepareRenderTexture = function( _width, _height )
{
	// create a render-to-texture frame buffer
	this.rttFb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFb);
	this.rttFb.width = _width;
	this.rttFb.height = _height;

	// create a texture surface to render to
	this.rtTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.rtTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rttFb.width, this.rttFb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // create a depth buffer
    this.rtDepth = gl.createRenderBuffer();
    gl.bindRenderBuffer(gl.RENDERBUFFER, this.rtDepth);
    gl.renderBufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.rttFb.width, this.rttFb.height);

    // attach the texture and depth buffers to the frame buffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rtTexture, 0);
    gl.frameBufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.rtDepth);

    // unbind everything
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderBuffer(gl.RENDERBUFFER, null);
    // NOTE: leave the frame buffer bound, it is now our target for all rendering until stopRenderTexture
    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};


/**
 * stopRenderTexture - stop future rendering going to the render texture
 *
 */
pbWebGlTextures.prototype.stopRenderTexture = function()
{
	// unbind the frame buffer to stop rendering to a texture and resume rendering to the display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};


/**
 * renderTextureAgain - rebind the rttFb frame buffer to render another image to the existing rtTexture
 *
 */
pbWebGlTextures.prototype.renderTextureAgain = function()
{
	if (this.rttFb)
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFb);
};


/**
 * prepareTextureForAccess - prepare a webGl texture to transfer it's content to system memory
 *
 */
pbWebGlTextures.prototype.prepareTextureForAccess = function()
{
	// make a framebuffer
	this.fb = gl.createFramebuffer();

	// make this the current frame buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

	// attach the texture to the framebuffer.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentTexture, 0);

	// check if you can read from this type of texture.
	this.canReadTexture = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);
};


/**
 * getTextureToCanvas - transfer a webGl texture to the Canvas associated with the context provided
 * 
 */
// from http://www.html5rocks.com/en/tutorials/webgl/webgl_fundamentals/
// and https://html.spec.whatwg.org/multipage/scripting.html#pixel-manipulation
// and https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
pbWebGlTextures.prototype.getTextureToCanvas = function(_ctx)
{
	if (this.canReadTexture && this.fb)
	{
		var canvas = _ctx.canvas;
		var imageData = _ctx.createImageData(canvas.width, canvas.height);

		// read the texture pixels into a typed array
		var buf8 = this.getTextureData(this.fb);

		// copy the typed array data into the ImageData surface
		var c = imageData.data.length;
		while(c--)
			imageData.data[c] = buf8[c];

		// put the ImageData on the _canvas
		_ctx.putImageData(imageData, 0, 0);
	}
};


/**
 * getTextureToSurface - grab a webGl texture on the GPU into a pbSurface texture
 * 
 */
pbWebGlTextures.prototype.getTextureToSurface = function(_ctx)
{
	if (this.canReadTexture && this.fb)
	{
		// read the texture pixels into a typed array
		var buf8 = this.getTextureData(this.fb);

		// create a ImageData to hold the texture
		var canvas = _ctx.canvas;
		var imageData = _ctx.createImageData(buf8.width, buf8.height);

		// copy the typed array data into the ImageData surface
		var c = imageData.data.length;
		while(c--)
			imageData.data[c] = buf8[c];

		// create a pbSurface to hold the ImageData
		var surface = new pbSurface();
		// _wide, _high, _numWide, _numHigh, _imageData)
		surface.create(buf8.width, buf8.height, 1, 1, imageData);

		return surface;
	}
	return null;
};


/**
 * getTextureData - transfer a webGl texture to a system RAM buffer (returns a Uint8Array)
 *
 */
// from http://learningwebgl.com/blog/?p=1786
pbWebGlTextures.prototype.getTextureData = function(_fb)
{
	if (this.canReadTexture && _fb)
	{
		// make this the current frame buffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);

		// attach the texture to the framebuffer again (to update the contents)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentTexture, 0);

		// dimensions of the texture, branch depending on the original image source
		var wide, high;
		if (this.currentTexture.image)
		{
			wide = this.currentTexture.image.width;
			high = this.currentTexture.image.height;
		}
		else if (this.currentTexture.canvas)
		{
			wide = this.currentTexture.canvas.width;
			high = this.currentTexture.canvas.height;
		}

		// read the texture pixels into a typed array
		var buf8 = new Uint8Array(wide * high * 4);
		buf8.width = wide;
		buf8.height = high;
		gl.readPixels(0, 0, wide, high, gl.RGBA, gl.UNSIGNED_BYTE, buf8);

		// unbind the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		return buf8;
	}
	return null;
};


// TODO: look into http://www.goocreate.com/learn/procedural-textures/

pbWebGlTextures.prototype.createTextureFromCanvas = function(_canvas)
{
//	var ctx = _canvas.getContext('2d');
//	var p2width = nextHighestPowerOfTwo(_canvas.width);
//	var p2height = nextHighestPowerOfTwo(_canvas.height);

	var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // clamp to permit NPOT textures, no MIP mapping
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _canvas);

	// activate the texture
    this.currentTexture = texture;
    this.currentTexture.canvas = _canvas;
    gl.activeTexture( gl.TEXTURE0 );

	// create a buffer to transfer all the vertex position data through
	this.positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
};




