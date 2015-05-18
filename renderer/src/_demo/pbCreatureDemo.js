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

	// add the shader
	var jsonString = this.loader.getFile( this.stripShaderJSON ).responseText;
	this.stripShaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );

	// get the animation JSON data
	jsonString = this.loader.getFile( this.dinoJSON ).responseText;
	var actual_JSON = JSON.parse(jsonString);

	var new_creature = new Creature(actual_JSON);
	
	var new_animation_1 = new CreatureAnimation(actual_JSON, "default", new_creature);
//	var new_animation_2 = new CreatureAnimation(actual_JSON, "pose2", new_creature);
	
	this.new_manager = new CreatureManager(new_creature);
	this.new_manager.AddAnimation(new_animation_1);
	//this.new_manager.AddAnimation(new_animation_2);
	this.new_manager.SetActiveAnimationName("default", false);
	this.new_manager.SetShouldLoop(true);
	this.new_manager.SetIsPlaying(true);
	this.new_manager.RunAtTime(0);

    // get the texture object from the textures dictionary using 'key'
    this.textureObject = textures.getFirst("dino");
	// create the creature renderer
	this.new_creature_renderer = new CreatureRenderer(this.new_manager, this.textureObject.imageData);
};


pbCreatureDemo.prototype.destroy = function()
{
	console.log("pbCreatureDemo.destroy");

	this.new_manager = null;
	this.new_creature_renderer = null;
	this.surface.destroy();

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;
};


pbCreatureDemo.prototype.restart = function()
{
	console.log("pbCreatureDemo.restart");
	
	this.destroy();
	this.create();
};



pbCreatureDemo.prototype.update = function()
{
	this.new_manager.Update(0.05);
	this.new_creature_renderer.UpdateData(this.renderer.graphics, this.stripShaderProgram);
};

