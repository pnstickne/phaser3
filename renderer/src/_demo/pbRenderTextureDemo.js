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
	// // draw this image to a render-to-texture, not the display
	// img.toTexture = true;

	// this.layer = new layerClass();
	// // _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	// this.layer.create(rootLayer, this.renderer, 0,0,0, 0, 1, 1);
	// // attach the layer to the rootLayer so it gets processed by renderer.update
	// // nothing will be drawn on rootLayer because the pbImage.toTexture flag is true
	// // drawing will go to a render-to-texture instead
	// rootLayer.addChild(this.layer);

	// this.spr = new pbSprite();
	// // _image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	// this.spr.create(img, 200, 200, 1.0, 0, 1.0, 1.0);
	// this.layer.addChild(this.spr);

	this.dirx = 2;
};


    var rttFramebuffer;
    var rttTexture;


    pbRenderTextureDemo.prototype.initTextureFramebuffer = function()
    {
		// create an empty texture to draw to
		rttTexture = gl.createTexture();
        rttTexture.width = pbRenderer.width;
        rttTexture.height = pbRenderer.height;
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttTexture.width, rttTexture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        //gl.generateMipmap(gl.TEXTURE_2D);

        // attach the texture to the framebuffer
		rttFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

        rttRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rttRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttTexture.width, rttTexture.height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rttRenderbuffer);

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };


    pbRenderTextureDemo.prototype.drawSceneToTexture = function()
    {
		this.renderer.graphics.drawImageWithTransform(srcImage, this.transform, 1.0);
    };


    pbRenderTextureDemo.prototype.drawScene = function()
    {
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		gl.viewport(0, 0, rttFramebuffer.width, rttFramebuffer.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.drawSceneToTexture();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.renderer.graphics.prepareGl();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		this.renderer.graphics.drawTextureWithTransform(rttTexture, this.transform, 1.0);
    };

var verts = [
	1,  1,
	-1,  1,
	-1, -1,
	1,  1,
	-1, -1,
	1, -1
];

pbRenderTextureDemo.prototype.update = function()
{
	if (this.firstTime)
	{
		this.vertBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		this.initTextureFramebuffer();
		this.transform = pbMatrix3.makeTransform(10, 10, 0, 1, 1);
		this.firstTime = false;
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		// clear the texture using a varying green shade to make it stand out
		gl.clearColor(0, (pbRenderer.frameCount % 100 / 100), 0, 1); // green shades;
		gl.clear(gl.COLOR_BUFFER_BIT);
		this.drawSceneToTexture();
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// clear the display to red so we know when stuff is working...
	gl.clearColor(1, 0, 0, 1); // red
	gl.clear(gl.COLOR_BUFFER_BIT);

	// draw texture to the display
	this.renderer.graphics.shaders.setProgram(this.renderer.graphics.shaders.simpleShaderProgram);
	gl.bindTexture(gl.TEXTURE_2D, rttTexture);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(0);
	gl.drawArrays(gl.TRIANGLES, 0, 3 * 2);	// three vertices per tri, two tris


	// if (this.firstTime)
	// {
	// 	this.initTextureFramebuffer();
	// 	this.transform = pbMatrix3.makeTransform(128, 128, 0, 1, 1);
	// 	this.firstTime = false;
	// }

	// this.drawScene();




	// rotate
	// this.spr.angleInRadians += 0.01;

	// bounce the sprite across the renderer view
	// this.spr.x += this.dirx;
	// if (this.spr.x < 50) this.dirx = -this.dirx;
	// if (this.spr.x > 256 - 50) this.dirx = -this.dirx;

	// don't try to grab the render texture before it's even been created...
	// if (this.renderer.graphics.textures.currentDstTexture)
	// {
	// 	// this.renderer.graphics.textures.prepareRenderToTexture();

	// 	// prepare the texture to be grabbed by attaching it to a frame buffer (once only)
	// 	// if (!this.renderer.graphics.textures.canReadTexture)
	// 	this.renderer.graphics.textures.prepareTextureForAccess(this.renderer.graphics.textures.currentDstTexture);

	// 	// grab the webGl.currentSrcTexture and draw it into the destination canvas as ImageData
	// 	if (!this.renderSurface)
	// 		this.renderSurface = new pbSurface();
	// 	this.renderer.graphics.textures.getTextureToSurface(gl, this.renderSurface);

	// 	// first time we obtain the rendered surface, attach it so it'll get rendered to the rootLayer
	// 	if (this.firstTime)
	// 	{
	// 		// this image does not set toTexture, it'll display as normal instead of being rendered to a texture

	// 		var img = new imageClass();
	// 		// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	// 		img.create(this.renderSurface, 0, 0.5, 0.5);

	// 		this.displayLayer = new layerClass();
	// 		// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	// 		this.displayLayer.create(rootLayer, this.renderer, 0,0,0, 0, 1, 1);
	// 		rootLayer.addChild(this.displayLayer);

	// 		this.renderSprite = new pbSprite();
	// 		// _image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	// 		this.renderSprite.create(img, 128, 128, 0, 0, 1, 1);
	// 		this.displayLayer.addChild(this.renderSprite);

	// 		this.firstTime = false;
	// 	}
	// }
};

