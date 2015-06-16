/**
 *
 * BallLight demo - uses a shader to show lighting with normal maps, using perfect balls lets us see errors in the shader and maths more easily
 *
 * TODO:
 * - specular reflection is grainy when it should be perfectly smooth... maths limits due to lightHigh, or poor normal map smoothing?
 * - rotating ball (bottom left) the specular reflection rotates with the ball a bit, it shouldn't move at all
 * - insufficient curvature from the normal maps, is this the vectors created by SpriteDLight, or the source image, or the shader
 * 
 */



// created while the data is loading (preloader)
function pbBallLightDemo( docId )
{
	console.log( "pbBallLightDemo c'tor entry" );

	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( 'webgl', this.create, this.update, this );

	this.diffuseImg = pbPhaserRender.loader.loadImage( "texture", "../img/spriteDLight/redBall_512.png" );
	this.normalsImg = pbPhaserRender.loader.loadImage( "normals", "../img/spriteDLight/sphere_512_NORMALS.png" );
	this.specularImg = pbPhaserRender.loader.loadImage( "specular", "../img/spriteDLight/sphere_512_SPECULAR.png" );

	this.multiLightShaderJSON = pbPhaserRender.loader.loadFile( "../json/spriteDLightSpecular.json" );

	console.log( "pbBallLightDemo c'tor exit" );
}


pbBallLightDemo.prototype.create = function()
{
	console.log("pbBallLightDemo.create");

	// set the light source's parameters
	this.lightColour = { r:1.0, g:1.0, b:0.9 };
	this.lightHigh = 3.0;
	this.lightSpecular = 0.5;					// power of the specular reflection
	this.lightSpecularMult = 1000.0;		// smaller numbers make the specular "hotspot" wider
	this.lightAmbient = 0.3;

	// prepare the light source auto-movement
	this.lightPos = { x:0.0, y:0.0, z:-1.0 };
	this.lightRadius = 0.25;
	this.lightAngle = 90.0;


	// add the shader
	var jsonString = pbPhaserRender.loader.getFile( this.multiLightShaderJSON ).responseText;
	this.spriteDLightShaderProgram = pbPhaserRender.renderer.graphics.shaders.addJSON( jsonString );

	// create a GPU texture containing the source image
	this.rttTextureNumber = 1;
	var imageData = pbPhaserRender.loader.getFile( this.diffuseImg );
	// _imageData, _tiling, _npot, _textureNumber, _flipy
	pbPhaserRender.renderer.graphics.textures.prepare(imageData, false, false, this.rttTextureNumber, true);
	this.rttTexture = pbPhaserRender.renderer.graphics.textures.currentSrcTexture;
	this.rttTexture.register = this.rttTextureNumber;

	// create an independent layer that will be processed in postUpdate to draw all the sprites
	this.layer = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.layer.create(rootLayer, this.phaserRender, 0, 0, 0, 0, 1, 1);

    // get the normals
    this.normalsTextureNumber = 2;
	imageData = pbPhaserRender.loader.getFile( this.normalsImg );
	// upload the normals image directly to the GPU
	pbPhaserRender.renderer.graphics.textures.prepare(imageData, false, true, this.normalsTextureNumber, true);

    // get the specular brightness
    this.specularTextureNumber = 3;
	imageData = pbPhaserRender.loader.getFile( this.specularImg );
	// upload the specular image directly to the GPU
	pbPhaserRender.renderer.graphics.textures.prepare(imageData, false, true, this.specularTextureNumber, true);

	// create some lit sprites with unique texture surfaces
	this.destWidth = 128;
	this.destHeight = 128;
	this.litSprite = [];
	for(var i = 0; i < 9; i++)
	{
		// create a texture to render to with lighting applied
		var tn = 4 + i;
		var texture = pbWebGlTextures.initTexture(tn, this.destWidth, this.destHeight);

		// create a sprite which uses that texture as it's source
		var sprite = new pbSprite();
		sprite.createGPU(pbPhaserRender.width / 2 + (i % 3 - 1) * this.destWidth, pbPhaserRender.height / 2 - (Math.floor(i / 3) - 1) * this.destHeight, texture, this.layer);
		sprite.anchorX = sprite.anchorY = 0.5;
		sprite.transform.scaleX = sprite.transform.scaleY = 1.0;

		this.litSprite[i] = {
			textureNumber : tn,
			texture : texture,
			framebuffer : pbWebGlTextures.initFramebuffer(texture, null),
			sprite : sprite
		};
	}

	// designate one sprite that moves around to test the position relative lighting calculations
	this.movingSprite = 0;
	this.dirx = 3;
	this.diry = 2;

	// designate one sprite that rotates slowly to test the rotational lighting calculations
	this.turningSprite = 8;

	// set up the renderer postUpdate callback to apply the filter and draw the result on the display
    pbPhaserRender.renderer.postUpdate = this.postUpdate;

    this.lock = false;
    this.move = pbPhaserRender.frameCount;

    // detect mouse move over canvas and set the light position there
    var _this = this;
	document.body.onmousemove = function(e) {
		if (!_this.lock)
		{
			_this.lightPos.x = (e.clientX / pbPhaserRender.width);
			_this.lightPos.y = (e.clientY / pbPhaserRender.height);
			_this.move = pbPhaserRender.frameCount;
		}
	};
	document.body.onmousedown = function(e) {
		_this.lightPos.x = (e.clientX / pbPhaserRender.width);
		_this.lightPos.y = (e.clientY / pbPhaserRender.height);
		_this.lock = !_this.lock;
		if (_this.lock)
			_this.move = pbPhaserRender.frameCount + 10000;
	};
};


pbBallLightDemo.prototype.destroy = function()
{
	console.log("pbBallLightDemo.destroy");

	this.phaserRender.destroy();
	this.phaserRender = null;

	this.rttTexture = null;

	this.litSprite = null;
};


pbBallLightDemo.prototype.update = function()
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
pbBallLightDemo.prototype.postUpdate = function()
{
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	for(var i = 0, l = this.litSprite.length; i < l; i++)
	{
		var litSprite = this.litSprite[i];

		// bind the framebuffer for this litSprite's source texture to be drawn to with the lighting shader
		gl.bindFramebuffer(gl.FRAMEBUFFER, litSprite.framebuffer);
		// clear the texture ready to receive a texture with alpha
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

		// calculate the light position relative to the centre of this litSprite
		// in the litSprite's own coordinate frame (0..1 = the width/height of the texture)
		// 
		// divide screen coordinates of sprite (pixels) by screen size, for 0..1 = width and height of screen (same as lightPos)
		// then rescale by screen dimension / texture dimension to get texture coordinate frame
		this.lightRelX = (this.lightPos.x - litSprite.sprite.x / pbPhaserRender.width)  * (pbPhaserRender.width / this.destWidth);
		this.lightRelY = (litSprite.sprite.y / pbPhaserRender.height - this.lightPos.y) * (pbPhaserRender.height / this.destHeight);

		this.rotation = litSprite.sprite.angleInRadians;

		// copy the rttTexture to the framebuffer attached texture, applying a shader as it draws
		gl.activeTexture(gl.TEXTURE1);
		pbPhaserRender.renderer.graphics.applyShaderToTexture( this.rttTexture, this.setShader, this );
	}

	//
	// update the pbSprite layer to draw them all
	//
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);		// clear framebuffer binding to ensure this draws to the screen and not another texture
	this.layer.update();
};


// callback to set the correct shader program and it's associated attributes and/or uniforms
pbBallLightDemo.prototype.setShader = function(_shaders, _textureNumber)
{
   	// set the shader program
	_shaders.setProgram(this.spriteDLightShaderProgram, _textureNumber);

	// set the auxillary sampler textures
	gl.uniform1i( _shaders.getSampler( "uNormalSampler" ), this.normalsTextureNumber );
	gl.uniform1i( _shaders.getSampler( "uSpecularSampler" ), this.specularTextureNumber );

	// set the parameters for the shader program
	gl.uniform1f( _shaders.getUniform( "uSpecularMult" ), this.lightSpecularMult );
	gl.uniform3f( _shaders.getUniform( "uSpecularCol" ), this.lightSpecular, this.lightSpecular, this.lightSpecular );

	gl.uniform3f( _shaders.getUniform( "uAmbientCol" ), this.lightAmbient, this.lightAmbient, this.lightAmbient );

	gl.uniform3f( _shaders.getUniform( "uLightCol" ), this.lightColour.r, this.lightColour.g, this.lightColour.b);
	gl.uniform3f( _shaders.getUniform( "uLightPos" ), this.lightRelX, this.lightRelY, this.lightHigh );

	gl.uniform2f( _shaders.getUniform( "uDstSize" ), this.destWidth, this.destHeight );

	var sin = Math.sin(-this.rotation);
	var cos = Math.cos(-this.rotation);
	gl.uniform2f( _shaders.getUniform( "uRotateFactors" ), sin, cos );
};

