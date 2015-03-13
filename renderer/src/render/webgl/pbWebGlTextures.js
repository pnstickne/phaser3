/**
 *
 * pbWebGlTextures.js - texture handler for the pbWebGl drawing functions
 * 
 */


function pbWebGlTextures()
{
	this.onGPU = null;
	this.fb = null;
	this.currentSrcTexture = null;
	this.canReadTexture = false;
	this.rttFb = null;
	this.currentDstTexture = null;
	this.rtDepth = null;
}


pbWebGlTextures.prototype.create = function()
{
	this.onGPU = [];
	this.fb = null;
	this.currentSrcTexture = null;
	this.canReadTexture = false;
	this.rttFb = null;
	this.currentDstTexture = null;
	this.rtDepth = null;
};


pbWebGlTextures.prototype.destroy = function()
{
	this.onGPU = null;
	this.fb = null;
	this.currentSrcTexture = null;
	this.rttFb = null;
	this.currentDstTexture = null;
	this.rtDepth = null;
};


/**
 * prepare - prepare a texture to be rendered with webGl
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
	if (this.currentSrcTexture && this.currentSrcTexture.image === _image)
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

		console.log( "pbWebGlTextures.prepare uploading new source texture : ", _image.width, "x", _image.height );

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
    this.currentSrcTexture = texture;
    gl.activeTexture( gl.TEXTURE0 );

    return true;
};


// http://stackoverflow.com/questions/13626465/how-to-create-a-new-imagedata-object-independently
function ImageData(_width, _height)
{
	console.log("ImageData", _width, "x", _height);

    var canvas = document.createElement('canvas');
    canvas.width = _width;
    canvas.height = _height;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.createImageData(canvas.width, canvas.height);
    return imageData;
}


/**
 * prepare - prepare a texture for webGl to render to it, leave it bound to the framebuffer so everything will go there
 *
 */
pbWebGlTextures.prototype.prepareRenderToTexture = function( _width, _height )
{
	console.log( "pbWebGlTextures.prepareRenderToTexture creating new target texture : ", _width, "x", _height );

	// create a render-to-texture frame buffer
	this.rttFb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFb);
	this.rttFb.width = _width;
	this.rttFb.height = _height;

	// create a texture surface to render to
	this.currentDstTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.currentDstTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    //gl.generateMipmap(gl.TEXTURE_2D);

	// create a new ImageData to hold the texture pixels
	this.currentDstTexture.image = new ImageData(_width, _height);
	// link the image to the destination texture
	this.currentDstTexture.image.gpuTexture = this.currentDstTexture;

	var dataTypedArray = new Uint8Array(this.currentDstTexture.image.data);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rttFb.width, this.rttFb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, dataTypedArray);


    // create a depth buffer
    this.rtDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.rtDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.rttFb.width, this.rttFb.height);

    // attach the texture and depth buffers to the frame buffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentDstTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.rtDepth);

    // unbind everything
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};


/**
 * setRenderTargetToTexture - rebind the rttFb frame buffer to render to currentDstTexture
 * 
 */
pbWebGlTextures.prototype.setRenderTargetToTexture = function(_width, _height)
{
	if (!this.rttFb)
	{
		// create the destination texture
		this.prepareRenderToTexture(_width, _height);
	}
	console.log("pbWebGlTextures.setRenderTargetToTexture", _width, "x", _height);

	// rebind the frame buffer containing the destination texture
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFb);
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


pbWebGlTextures.prototype.setRenderSourceImage = function( _image )
{
	// make sure that _image is the current source texture
	if (!this.currentSrcTexture || this.currentSrcTexture.image !== _image)
	{
		console.log("pbWebGlTextures.setRenderSourceImage", _image.width, "x", _image.height);

		var index = this.onGPU.indexOf(_image);
		if (index == -1)
			this.onGPU.push(_image);
		texture = _image.gpuTexture;
		if (texture === null)
			console.log("WARNING: image has null for gpuTexture.");
		gl.bindTexture(gl.TEXTURE_2D, texture);
		this.currentSrcTexture = texture;
		gl.activeTexture( gl.TEXTURE0 );
	}
};


/**
 * prepareTextureForAccess - prepare a webGl texture as currentSrcTexture, ready to transfer it's content to system memory
 *
 */
pbWebGlTextures.prototype.prepareTextureForAccess = function(_texture)
{
	if (_texture.canvas)
		console.log("pbWebGlTextures.prepareTextureForAccess", _texture.canvas.width, "x", _texture.canvas.height);
	else
		console.log("pbWebGlTextures.prepareTextureForAccess", _texture.image.width, "x", _texture.image.height);

	// make a framebuffer
	this.fb = gl.createFramebuffer();

	// make this the current frame buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

	// attach the texture to the framebuffer.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, _texture, 0);

	// check if you can read from this type of texture.
	this.canReadTexture = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);

	// remember which texture we're working with
    this.currentSrcTexture = _texture;
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
		var buf8 = this.getTextureData(this.fb, this.currentSrcTexture);

		// copy the typed array data into the ImageData surface
		var c = imageData.data.length;
		while(c--)
			imageData.data[c] = buf8[c];

		// put the ImageData on the _canvas
		_ctx.putImageData(imageData, 0, 0);
	}
};


/**
 * getTextureToSurface - grab the currentSrcTexture from the GPU into a pbSurface
 * 
 */
pbWebGlTextures.prototype.getTextureToSurface = function(_ctx, _surface)
{
	if (this.canReadTexture && this.fb)
	{
		var wide = this.currentSrcTexture.image.width;
		var high = this.currentSrcTexture.image.height;
		console.log("pbWebGlTextures.getTextureToSurface", wide, "x", high);

		// transfer the destination texture pixels from the GPU into a typed array
		var buf8 = this.getTextureData(this.fb, this.currentSrcTexture);
		var image = _surface.image;
		if (!image || image.width != wide || image.height != high)
		{
			// create an ImageData to copy the pixels into
			image = new ImageData(wide, high);
		}
		// copy the pixels into the new ImageData
		var c = this.currentSrcTexture.image.data.length;
		while(c--)
		{
			image.data[c] = buf8[c];
			if (buf8[c] !== 0)
				console.log((c / 4) % 256, 0|((c / 4) / 256));
		}

		// associate the ImageData with the _surface
		// _wide, _high, _numWide, _numHigh, _imageData)
		_surface.create(buf8.width, buf8.height, 1, 1, image);
	}
};


/**
 * getTextureData - transfer a webGl texture from the GPU to a system RAM buffer (returns a Uint8Array)
 *
 */
// from http://learningwebgl.com/blog/?p=1786
pbWebGlTextures.prototype.getTextureData = function(_fb, _texture)
{
	if (this.canReadTexture && _fb)
	{
		// make _fb the current frame buffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);

		// attach the texture to the framebuffer again (to update the contents)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, _texture, 0);

		// dimensions of the texture, branch depending on the original image source
		var wide, high;
		if (_texture.canvas)
		{
			wide = _texture.canvas.width;
			high = _texture.canvas.height;
		}
		else if (_texture.image)
		{
			wide = _texture.image.width;
			high = _texture.image.height;
		}

		console.log("pbWebGlTextures.getTextureData", wide, "x", high);

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

	// upload the canvas image into the texture
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _canvas);

	// activate the texture
    this.currentSrcTexture = texture;
    this.currentSrcTexture.canvas = _canvas;
    gl.activeTexture( gl.TEXTURE0 );

	// create a buffer to transfer all the vertex position data through
	this.positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
};




