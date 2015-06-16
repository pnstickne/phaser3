/**
 *
 * SpriteDLight demo - uses a shader to show lighting with normal maps created by the SpriteDLight tool
 *
 */



// created while the data is loading (preloader)
function pbSpriteDLightDemo( docId )
{
	console.log( "pbSpriteDLightDemo c'tor entry" );

	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( 'webgl', this.create, this.update, this );

	pbPhaserRender.loader.loadImage( "texture", "../img/spriteDLight/standing1_0001.png" );
	this.normalsImg = pbPhaserRender.loader.loadImage( "normals", "../img/spriteDLight/standing1_0001_NORMALS.png" );
	this.specularImg = pbPhaserRender.loader.loadImage( "specular", "../img/spriteDLight/standing1_0001_SPECULAR.png" );

	this.multiLightShaderJSON = pbPhaserRender.loader.loadFile( "../json/spriteDLightSpecular.json" );

	console.log( "pbSpriteDLightDemo c'tor exit" );
}


pbSpriteDLightDemo.prototype.create = function()
{
	console.log("pbSpriteDLightDemo.create");

	// prepare the light circle and a sprite to show where it is
	this.lightPos = { x:0.0, y:0.0, z:-1.0 };
	this.lightRadius = 0.25;
	this.lightAngle = 90.0;
	this.move = 0;

	// create a sprite to hold the source image
	this.sprite = new pbSprite();
	this.sprite.createWithKey(0, 0, "texture", rootLayer);

	// add the shader
	var jsonString = pbPhaserRender.loader.getFile( this.multiLightShaderJSON ).responseText;
	this.spriteDLightShaderProgram = pbPhaserRender.renderer.graphics.shaders.addJSON( jsonString );

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTextureNumber = 1;
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, 600, 600);
	this.rttFramebuffer = pbWebGlTextures.useFramebufferRenderbuffer( this.rttTexture );

    // get the ImageData for the normals
    this.normalsTextureNumber = 2;
	var imageData = pbPhaserRender.loader.getFile( this.normalsImg );
	// upload the normals image directly to the GPU
	pbPhaserRender.renderer.graphics.textures.prepare(imageData, false, true, this.normalsTextureNumber, true);

    // get the ImageData for the specular information
    this.specularTextureNumber = 3;
	imageData = pbPhaserRender.loader.getFile( this.specularImg );
	// upload the normals image directly to the GPU
	pbPhaserRender.renderer.graphics.textures.prepare(imageData, false, true, this.specularTextureNumber, true);

	// create an independent layer that will be processed in postUpdate to draw all the sprites
	this.layer = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.layer.create(rootLayer, this.phaserRender, 0, 0, 0, 0, 1, 1);

	// create some lit sprites
	this.destWidth = 256;
	this.destHeight = 256;
	this.litSprite = [];
	for(var i = 0; i < 9; i++)
	{
		// create a texture to render to with lighting applied
		var tn = 4 + i;
		var texture = pbWebGlTextures.initTexture(tn, this.destWidth, this.destHeight);

		// create a sprite which uses that texture as it's source
		var sprite = new pbSprite();
		sprite.createGPU(pbPhaserRender.width / 2 + (i % 3 - 1) * 128, pbPhaserRender.height / 2 - (Math.floor(i / 3) - 1) * 128, texture, this.layer);
		sprite.anchorX = 0.5;
		sprite.anchorY = 0.5;
		sprite.transform.scaleX = sprite.transform.scaleY = 1.0;

		this.litSprite[i] = {
			textureNumber : tn,
			texture : texture,
			framebuffer : pbWebGlTextures.initFramebuffer(texture, null),
			sprite : sprite
		};

	}

	// designate one sprite that moves around to test the position relative lighting calculations
	this.movingSprite = 4;
	this.dirx = 3;
	this.diry = 2;
	this.turningSprite = 0;

	// set up the renderer postUpdate callback to apply the filter and draw the result on the display
    pbPhaserRender.renderer.postUpdate = this.postUpdate;

    // detect mouse move over canvas and set the light position there
    var _this = this;
	document.body.onmousemove = function(e) {
		_this.lightPos.x = (e.clientX / pbPhaserRender.width);
		_this.lightPos.y = (e.clientY / pbPhaserRender.height);
		_this.move = pbPhaserRender.frameCount;
		//console.log(_this.lightPos.x, _this.lightPos.y);
	};
};


pbSpriteDLightDemo.prototype.destroy = function()
{
	console.log("pbSpriteDLightDemo.destroy");

	this.phaserRender.destroy();
	this.phaserRender = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;

	this.litSprite = null;
};


pbSpriteDLightDemo.prototype.update = function()
{
	// pbPhaserRender automatically draws the sprites to the render-to-textures

	var moves = this.litSprite[this.movingSprite].sprite;
	moves.x += this.dirx;
	moves.y += this.diry;
	if (moves.x > pbPhaserRender.width) this.dirx = -this.dirx;
	if (moves.x < 0) this.dirx = -this.dirx;
	if (moves.y > pbPhaserRender.height) this.diry = -this.diry;
	if (moves.y < 0) this.diry = -this.diry;

	var turns = this.litSprite[this.turningSprite].sprite;
	turns.angleInRadians += 0.01;

	// only rotate the light if it's been quite a while since the last mouse move
	if (pbPhaserRender.frameCount - this.move > 180)
	{
		// move the light source in a circle around the middle of the output texture
		this.lightPos.x = 0.5 + this.lightRadius * Math.cos(this.lightAngle * Math.PI / 180.0);
		this.lightPos.y = 0.5 + this.lightRadius * Math.sin(this.lightAngle * Math.PI / 180.0);
		this.lightAngle += 0.5;
	}
};


/**
 * postUpdate - apply the shader to the rttTexture, then draw the results on screen
 *
 */
pbSpriteDLightDemo.prototype.postUpdate = function()
{
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	for(var i = 0, l = this.litSprite.length; i < l; i++)
	{
		var litSprite = this.litSprite[i];

		// bind the framebuffer for this litSprite's source texture to be drawn to with lighting
		gl.bindFramebuffer(gl.FRAMEBUFFER, litSprite.framebuffer);
		// clear the destTexture ready to receive a texture with alpha
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

		// calculate the light position relative to the centre of this litSprite
		// in the litSprite's own coordinate frame (0..1 = the width/height of the texture)
		// 
		// divide screen coordinates of sprite (pixels) by screen size, for 0..1 = width and height of screen (same as lightPos)
		// then rescale by screen dimension / texture dimension to get texture coordinate frame
		this.lightRelX = (this.lightPos.x - litSprite.sprite.x / pbPhaserRender.width)  * (pbPhaserRender.width / this.destWidth);
		this.lightRelY = (litSprite.sprite.y / pbPhaserRender.height - this.lightPos.y) * (pbPhaserRender.height / this.destHeight);

		// copy the rttTexture to the framebuffer attached texture, applying a shader as it draws
		gl.activeTexture(gl.TEXTURE1);
		pbPhaserRender.renderer.graphics.applyShaderToTexture( this.rttTexture, this.setShader, this );
	}

	// update the pbSprite layer to draw them all
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);		// clear previous binding
	this.layer.update();
};


// callback to set the correct shader program and it's associated attributes and/or uniforms
pbSpriteDLightDemo.prototype.setShader = function(_shaders, _textureNumber)
{
   	// set the shader program
	_shaders.setProgram(this.spriteDLightShaderProgram, _textureNumber);

	// set the auxillary sampler textures
	gl.uniform1i( _shaders.getSampler( "uNormalSampler" ), this.normalsTextureNumber );
	gl.uniform1i( _shaders.getSampler( "uSpecularSampler" ), this.specularTextureNumber );

	// set the parameters for the shader program
	gl.uniform1f( _shaders.getUniform( "uSpecularMult" ), 24.0 );					// smaller numbers make the specular "hotspot" wider
	gl.uniform3f( _shaders.getUniform( "uSpecularCol" ), 5.0, 5.0, 5.0 );			// larger numbers make the specular effect brighter

	gl.uniform3f( _shaders.getUniform( "uAmbientCol" ), 0.20, 0.20, 0.20 );			// ambient percentage for indirect lighting

	gl.uniform3f( _shaders.getUniform( "uLightCol" ), 1.0, 1.0, 1.0 );				// basic point light colour and brightness
	gl.uniform3f( _shaders.getUniform( "uLightPos" ), this.lightRelX, this.lightRelY, 0.1 );		// hardwire light to 0.1 above the scene (z direction)

	gl.uniform2f( _shaders.getUniform( "uDstSize" ), this.destWidth, this.destHeight );
};

