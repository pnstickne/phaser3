/**
 *
 * Point lights demo - uses a shader to generate lighting and shadows from multiple point sources.
 *
 */



// created while the data is loading (preloader)
function pbPointLightsDemo( docId )
{
	console.log( "pbPointLightsDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.gameLayer = null;
	this.game = null;

	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.loader.loadImage( "player", "../img/invader/player.png" );
	this.loader.loadImage( "invader", "../img/invader/invader32x32x4.png", 32, 32, 4, 1);
	//this.loader.loadImage( "stars", "../img/invader/starfield.png" );
	this.loader.loadImage( "bullet", "../img/invader/bullet.png" );
	this.loader.loadImage( "bomb", "../img/invader/enemy-bullet.png" );
	this.loader.loadImage( "rocket", "../img/invader/rockets32x32x8.png", 32, 32, 8, 1 );
	this.loader.loadImage( "smoke", "../img/invader/smoke64x64x8.png", 64, 64, 8, 1 );
	this.loader.loadImage( "explosion", "../img/invader/explode.png", 128, 128, 16, 1 );
	this.loader.loadImage( "font", "../img/fonts/arcadeFonts/16x16/Bubble Memories (Taito).png", 16, 16, 95, 7 );


	this.logoImg = this.loader.loadImage( "../img/phaser_128x32.png" );

	console.log( "pbPointLightsDemo c'tor exit" );
}


pbPointLightsDemo.prototype.allLoaded = function()
{
	console.log( "pbPointLightsDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbPointLightsDemo.prototype.create = function()
{
	console.log("pbPointLightsDemo.create");

	//
	// draw an instance of invaders
	//

	this.gameLayer = new layerClass();
	this.gameLayer.create(rootLayer, this.renderer, 0, 0, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.gameLayer);

	this.game = new pbInvaderDemoCore();
	this.game.create(this, this.gameLayer, false, true);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// set the frame buffer to be used as the destination during the draw phase of renderer.update (drawing the invaders)
   	this.renderer.useFramebuffer = this.rttFramebuffer;
   	this.renderer.useRenderbuffer = this.rttRenderbuffer;

	// create the filter destination texture and framebuffer
	this.filterTexture = pbWebGlTextures.initTexture(gl.TEXTURE1, pbRenderer.width, pbRenderer.height);
	this.filterFramebuffer = pbWebGlTextures.initFramebuffer(this.filterTexture, null);

	// set up the renderer postUpdate callback to apply the filter and draw the result on the display
    this.renderer.postUpdate = this.postUpdate;
};


pbPointLightsDemo.prototype.destroy = function()
{
	console.log("pbPointLightsDemo.destroy");

	this.gameLayer.destroy();
	this.gameLayer = null;

	this.renderer.destroy();
	this.renderer = null;

	this.game.destroy();
	this.game = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;

	this.filterTexture = null;
	this.filterFramebuffer = null;
};


pbPointLightsDemo.prototype.update = function()
{
	// update and draw the invaders demo core to the render-to-texture
	this.game.update();
};


/**
 * postUpdate - apply the filter to the rttTexture, then draw the results on screen
 *
 */
pbPointLightsDemo.prototype.postUpdate = function()
{
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// copy the rttTexture to the filterFramebuffer attached texture, applying a filter as it draws
	gl.activeTexture(gl.TEXTURE0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.filterFramebuffer);
	this.renderer.graphics.applyFilterToTexture(0, this.rttTexture, this.setFilter, this);

	// update transforms and draw sprites that are not shadow casters
	this.game.layer.update();

	// draw the filter texture to the display
	gl.activeTexture(gl.TEXTURE1);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.renderer.graphics.drawTextureToDisplay(1, this.filterTexture);
};


var lightData = [
// x, y, power/color, range
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0,
];


// pack bytes _r, _g and _b into a single float with four precision bits each
function pack(_r, _g, _b)
{
	return (Math.floor(_r * 16.0) + Math.floor(_g * 16.0) * 256.0 + Math.floor(_b * 16.0) * 256.0 * 256.0);
}


pbPointLightsDemo.prototype.setLightData = function()
{
	// first light is attached to the player ship
	lightData[0 * 4 + 0] = this.game.player.x / pbRenderer.width;
	lightData[0 * 4 + 1] = 1.0 - this.game.player.y / pbRenderer.height;
	lightData[0 * 4 + 2] = pack(0.0, 0.75, 0.0);
	lightData[0 * 4 + 3] = 0.05 + Math.abs((pbRenderer.frameCount % 64) - 32.0) / 32.0 * 0.05;

	var i, j;
	// next 7 lights are attached to explosions
	for(i = 0; i < Math.min(this.game.explosions.length, 7); i++)
	{
		var explosion = this.game.explosions[i];
		var life = explosion.image.cellFrame / 16.0;

		j = (i + 1) * 4;
		lightData[j + 0] = explosion.x / pbRenderer.width;
		lightData[j + 1] = 1.0 - explosion.y / pbRenderer.height;
		// fade from orange/yellow through to blue as the explosion ages
		lightData[j + 2] = pack(5.0 * (1.0 - life), 3.0 * (1.0 - life), 1.0 * life);
		// grow as the explosion ages
		lightData[j + 3] = 0.02 + life * 0.20;
	}
	for(;i < 7; i++)
	{
		j = (i + 1) * 4;
		// a light with power/colour of zero is switched off
		lightData[j + 2] = 0.0;
	}
	// the last 8 lights are attached to enemy bombs
	for(i = 0; i < Math.min(this.game.bombs.length, 8); i++)
	{
		var bomb = this.game.bombs[i];

		j = (i + 8) * 4;
		lightData[j + 0] = bomb.x / pbRenderer.width;
		lightData[j + 1] = 1.0 - bomb.y / pbRenderer.height;
		lightData[j + 2] = pack(1.0, 0, 0);
		lightData[j + 3] = 0.1;
	}
	for(;i < 8; i++)
	{
		j = (i + 8) * 4;
		lightData[j + 2] = 0.0;
	}
};


// callback required to set the correct filter program and it's associated attributes and/or uniforms
pbPointLightsDemo.prototype.setFilter = function(_filters, _textureNumber)
{
   	// set the filter program
	_filters.setProgram(_filters.multiLightShaderProgram, _textureNumber);

	// set the parameters for the filter shader program
	this.setLightData();

	// send them to the shader
	gl.uniform4fv( pbWebGlShaders.currentProgram.uniforms.uLights, lightData );
};

   	
