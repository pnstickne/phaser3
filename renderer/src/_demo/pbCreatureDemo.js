/**
 *
 * "Creature" animation system demo
 *
 * Based in part on PixiJs-Demo.html and CreaturePixiJSRenderer.js from the Creatures GitHub repository.
 *
 */



// created while the data is loading (preloader)
function pbCreatureDemo( docId )
{
	console.log( "pbCreatureDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.jsonData = null;
	this.new_manager = null;
	this.new_creature_renderer = null;

	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.stripShaderJSON = this.loader.loadFile( "../JSON/stripShaderSources.json" );
	this.dinoJSON = this.loader.loadFile( "../img/creatures/dino.CreaExport/character_data.json" );
	this.loader.loadImage( "dino", "../img/creatures/dino.CreaExport/character_img.png" );

	this.loader.loadImage( "player", "../img/invader/player.png" );
	this.loader.loadImage( "invader", "../img/invader/invader32x32x4.png", 32, 32, 4, 1);
	this.loader.loadImage( "stars", "../img/invader/starfield.png" );
	this.loader.loadImage( "bullet", "../img/invader/bullet.png" );
	this.loader.loadImage( "bomb", "../img/invader/enemy-bullet.png" );
	this.loader.loadImage( "rocket", "../img/invader/rockets32x32x8.png", 32, 32, 8, 1 );
	this.loader.loadImage( "smoke", "../img/invader/smoke64x64x8.png", 64, 64, 8, 1 );
	this.loader.loadImage( "explosion", "../img/invader/explode.png", 128, 128, 16, 1 );
	this.loader.loadImage( "font", "../img/fonts/arcadeFonts/16x16/Bubble Memories (Taito).png", 16, 16, 95, 7 );

	this.frame_l = this.loader.loadImage( "frame_l", "../img/frame_l.png" );
	this.frame_r = this.loader.loadImage( "frame_r", "../img/frame_r.png" );
	this.frame_t = this.loader.loadImage( "frame_t", "../img/frame_t.png" );
	this.frame_b = this.loader.loadImage( "frame_b", "../img/frame_b.png" );


	console.log( "pbCreatureDemo c'tor exit" );
}


pbCreatureDemo.prototype.allLoaded = function()
{
	console.log( "pbCreatureDemo.allLoaded" );

	this.renderer = new pbRenderer( "webgl", this.docId, this.create, this.update, this );
};


pbCreatureDemo.prototype.create = function()
{
	this.gameLayer = new layerClass();
	this.gameLayer.create(rootLayer, this.renderer, 0, 0, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.gameLayer);

	// add the game instance to a layer which is attached to the rootLayer
	// because otherwise the renderer.update won't update the game's sprite
	// transforms or draw them to the render-to-texture
	this.game = new pbInvaderDemoCore();
	this.game.create(this, this.gameLayer, true);


	console.log("pbCreatureDemo.create");

	// get the shader program
	var jsonString = this.loader.getFile( this.stripShaderJSON ).responseText;
	this.stripShaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );

	// get the animation JSON data
	jsonString = this.loader.getFile( this.dinoJSON ).responseText;
	var actual_JSON = JSON.parse(jsonString);

	// create the creature
	var new_creature = new Creature(actual_JSON);

	// create an animation object for it
	var new_animation_1 = new CreatureAnimation(actual_JSON, "default", new_creature);
	
	// create a creature manager for it
	this.new_manager = new CreatureManager(new_creature);

	// add the animation to the manager
	this.new_manager.AddAnimation(new_animation_1);
	//this.new_manager.AddAnimation(new_animation_2);

	// prepare the manager settings
	this.new_manager.SetActiveAnimationName("default", false);
	this.new_manager.SetShouldLoop(true);
	this.new_manager.SetIsPlaying(true);
	this.new_manager.RunAtTime(0);

    // get the source texture from the textures dictionary using 'key'
    this.textureObject = textures.getFirst("dino");

	// create the creature renderer using the manager and the texture
	this.creatureTextureNumber = 0;
	this.new_creature_renderer = new CreatureRenderer(this.new_manager, this.textureObject.imageData);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTextureNumber = 1;
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// set up the renderer postUpdate callback to draw the camera sprite using the render-to-texture surface on the GPU
    this.renderer.postUpdate = this.postUpdate;

	// set the frame buffer to be used as the destination during the draw phase of renderer.update
   	this.renderer.useFramebuffer = this.rttFramebuffer;
   	this.renderer.useRenderbuffer = this.rttRenderbuffer;
};


pbCreatureDemo.prototype.destroy = function()
{
	console.log("pbCreatureDemo.destroy");

	this.new_manager = null;
	this.new_creature_renderer = null;
	this.textureObject = null;

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
};


pbCreatureDemo.prototype.update = function()
{
	this.game.update();

	// update the creature manager for a given time interval
	this.new_manager.Update(0.02);

	// recalculate this creature's point data
	this.new_creature_renderer.UpdateData();

	// draw the creature with webgl, the draw destination will be this.renderer.useFrameBuffer
    var transform = pbMatrix3.makeTransform(0.0, 0.0, 0.0, 0.08, 0.10);
	this.new_creature_renderer.DrawCreature(transform, this.renderer.graphics, this.stripShaderProgram, this.creatureTextureNumber);
};


pbCreatureDemo.prototype.postUpdate = function()
{
	// don't render to texture any more, render to the display instead
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// draw the creature texture from rttTexture to the display
	this.transform = pbMatrix3.makeTransform(pbRenderer.width * 0.5, pbRenderer.height * 0.5, 0.0, 1.0, 1.0);
	this.renderer.graphics.drawTextureWithTransform( this.rttTextureNumber, this.rttTexture, this.transform, 1.0 );

	// _image, _transform, _z
	this.transform = pbMatrix3.makeTransform(pbRenderer.width * 0.25, pbRenderer.height * 0.5, 0.5, 0.5, 0.5);
	this.renderer.graphics.drawTextureWithTransform( this.rttTextureNumber, this.rttTexture, this.transform, 1.0 );
};

