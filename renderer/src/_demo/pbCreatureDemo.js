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


	console.log( "pbCreatureDemo c'tor exit" );
}


pbCreatureDemo.prototype.allLoaded = function()
{
	console.log( "pbCreatureDemo.allLoaded" );

	this.renderer = new pbRenderer( "webgl", this.docId, this.create, this.update, this );
};


pbCreatureDemo.prototype.create = function()
{
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
	this.new_creature_renderer = new CreatureRenderer(this.new_manager, this.textureObject.imageData);
	this.creatureTextureNumber = 2;

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTextureNumber = 1;
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// set the transformation for rendering to the render-to-texture
	this.transform = pbMatrix3.makeTransform(0, 0, 0, 1.0, 1.0);

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
	// update the creature manager for a given time interval
	this.new_manager.Update(0.02);

	// recalculate this creature's point data
	this.new_creature_renderer.UpdateData();

	// draw the creature with webgl, using this.renderer.useFrameBuffer etc
    var transform = pbMatrix3.makeTransform(0.0, 0.0, 0.0, 0.08, 0.10);
	this.new_creature_renderer.DrawCreature(transform, this.renderer.graphics, this.stripShaderProgram, this.creatureTextureNumber);
};


pbCreatureDemo.prototype.postUpdate = function()
{
	// don't render to texture any more, render to the display instead
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// _image, _transform, _z
	this.renderer.graphics.drawTextureWithTransform( this.rttTextureNumber, this.rttTexture, this.transform, 1.0 );
};

