/**
 *
 * "Creature" animation system demo
 *
 * Based in part on PixiJs-Demo.html and CreaturePixiJSRenderer.js from the Creatures GitHub repository.
 * This example does not use the pbCreatureHandler and shows how to access all of the lower level
 * CreaturePhaser3JSRenderer functions directly.
 * 
 * Utah Raptor original image
 * from: https://commons.wikimedia.org/wiki/Category:Utahraptor#/media/File:Utahraptor_updated.png
 * by: https://commons.wikimedia.org/wiki/User:Ferahgo_the_Assassin  e.deinonychus@gmail.com
 * license: http://creativecommons.org/licenses/by-sa/3.0/
 * The original image has been sliced and is warped by the Creature software for animation display.
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
	this.dinoZip = this.loader.loadFile( "../img/creatures/utah.CreaExport/character_data.zip", "arraybuffer" );
	this.loader.loadImage( "dino", "../img/creatures/utah.CreaExport/character_img.png" );

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

	// allocate the GPU texture registers
	this.creatureTextureNumber = 1;		// source texture for dino skin
	this.rttTextureNumber = 2;			// render-to-texture is source for the sprites

	// get the shader program
	var jsonString = this.loader.getFile( this.stripShaderJSON ).responseText;
	this.stripShaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );

	// unzip the compressed data file and create the animation JSON data structure
	var zip = new JSZip( this.loader.getFile( this.dinoZip ).response );
	var dinoJSON = zip.file("character_data.json").asText();
	var actual_JSON = JSON.parse(dinoJSON);

    // get the source texture from the textures dictionary using 'key'
    this.textureObject = textures.getFirst("dino");

	// make the creature from the json data and texture
	this.makeCreature(actual_JSON, this.textureObject);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
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


pbCreatureDemo.prototype.makeCreature = function(json, texture)
{
	// create the creature
	var new_creature = new Creature(json, texture);

	// create an animation object for it
	var new_animation_1 = new CreatureAnimation(json, "default", new_creature);
	
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

	// prepare a cache of points to speed up the playback
	// WARNING: slow - 4 seconds for one animation of the Utah Raptor
	//this.new_manager.MakePointCache("default");

	// create the creature renderer using the manager and the texture
	this.new_creature_renderer = new CreatureRenderer(this.new_manager, texture.imageData);
};


pbCreatureDemo.prototype.update = function()
{
	// update the creature manager for a given time interval
	this.new_manager.Update(0.04);

	// recalculate this creature's point data
	this.new_creature_renderer.UpdateData();

	// draw the creature with webgl, the draw destination will be this.renderer.useFramebuffer (rttTexture)
    var transform = pbMatrix3.makeTransform(-0.15, 0.0, 0.0, 0.04, 0.04);
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
};

