/**
 *
 * "Creature" animation system demo showing a flock of dinosaurs
 *
 * Utah Raptor original image
 * from: https://commons.wikimedia.org/wiki/Category:Utahraptor#/media/File:Utahraptor_updated.png
 * by: https://commons.wikimedia.org/wiki/User:Ferahgo_the_Assassin  e.deinonychus@gmail.com
 * license: http://creativecommons.org/licenses/by-sa/3.0/  via Wikimedia Commons
 * The original image has been sliced and is warped by the Creature software for animation display.
 *
 * Field background
 * By Fritz Geller-Grimm and Felix Grimm (Own work)
 * [CC BY-SA 2.5 (http://creativecommons.org/licenses/by-sa/2.5) or CC BY-SA 2.5 (http://creativecommons.org/licenses/by-sa/2.5)]
 * via Wikimedia Commons
 * 
 */



// created while the data is loading (preloader)
function pbCreatureFlockDemo( docId )
{
	console.log( "pbCreatureFlockDemo c'tor entry" );

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
	this.loader.loadImage( "field", "../img/Le_Caylar_fg08.png" );

	console.log( "pbCreatureFlockDemo c'tor exit" );
}


pbCreatureFlockDemo.prototype.allLoaded = function()
{
	console.log( "pbCreatureFlockDemo.allLoaded" );

	this.renderer = new pbRenderer( "webgl", this.docId, this.create, this.update, this );
};


pbCreatureFlockDemo.prototype.create = function()
{
	console.log("pbCreatureFlockDemo.create");

	// allocate the GPU texture registers
	this.creatureTextureNumber = 1;		// source texture for dino skin
	this.rttTextureNumber = 2;			// render-to-texture is source for the sprites
	this.rttTextureNumber2 = 3;			// render-to-texture is source for the sprites

	// get the shader program
	var jsonString = this.loader.getFile( this.stripShaderJSON ).responseText;
	this.stripShaderProgram = this.renderer.graphics.shaders.addJSON( jsonString );

	// background
	if (textures.exists("field"))
	{
		this.bg = new pbSprite(0, 0, "field", rootLayer);
		this.bg.fullScreen = true;
		this.bg.tiling = false;
	}

	// unzip the compressed data file and create the animation JSON data structure
	var zip = new JSZip( this.loader.getFile( this.dinoZip ).response );
	var dinoJSON = zip.file("character_data.json").asText();
	var actual_JSON = JSON.parse(dinoJSON);

    // get the source texture from the textures dictionary using 'key'
    this.textureObject = textures.getFirst("dino");

	// make the creature from the json data and texture
	this.new_manager = this.makeCreature(actual_JSON, this.textureObject);
	this.new_manager2 = this.makeCreature(actual_JSON, this.textureObject);

	// create the creature renderer using the manager and the texture
	this.new_creature_renderer = new CreatureRenderer(this.new_manager, this.textureObject.imageData);
	this.new_creature_renderer2 = new CreatureRenderer(this.new_manager2, this.textureObject.imageData);

	// make the flocks
	this.list = [];
	this.makeFlock([
			{ prob: 0.2, texture: this.rttTextureNumber, size: 1.0, speed: 2.0, yoff: 0.0 },
			{ prob: 0.8, texture: this.rttTextureNumber2, size: 0.6, speed: 4.0, yoff: 50.0 }],
			30);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTexture2 = pbWebGlTextures.initTexture(this.rttTextureNumber2, pbRenderer.width, pbRenderer.height);
	this.rttRenderbuffer2 = pbWebGlTextures.initDepth(this.rttTexture2);
	this.rttFramebuffer2 = pbWebGlTextures.initFramebuffer(this.rttTexture2, this.rttRenderbuffer2);

	this.textureList = [ null, null, this.rttTexture, this.rttTexture2 ];

	// set up the renderer postUpdate callback to draw the camera sprite using the render-to-texture surface on the GPU
    this.renderer.postUpdate = this.postUpdate;
};


pbCreatureFlockDemo.prototype.destroy = function()
{
	console.log("pbCreatureFlockDemo.destroy");

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


pbCreatureFlockDemo.prototype.makeCreature = function(json, texture)
{
	// create the creature
	var new_creature = new Creature(json, texture);

	// create an animation object for it
	var new_animation_1 = new CreatureAnimation(json, "default", new_creature);
	
	// create a creature manager for it
	var new_manager = new CreatureManager(new_creature);

	// add the animation to the manager
	new_manager.AddAnimation(new_animation_1);

	// prepare the manager settings
	new_manager.SetActiveAnimationName("default", false);
	new_manager.SetShouldLoop(true);
	new_manager.SetIsPlaying(true);
	new_manager.RunAtTime(0);

	// prepare a cache of points to speed up the playback
	// WARNING: slow - 4 seconds for one animation of the Utah Raptor
	//this.new_manager.MakePointCache("default");

	return new_manager;
};


pbCreatureFlockDemo.prototype.makeFlock = function(_mixtureList, _flockSize)
{
	for(var i = 0; i < _flockSize; i++)
	{
		var m;
		do{
			for(m = 0; m < _mixtureList.length; m++)
				if (Math.random() < _mixtureList[m].prob)
					break;
		}while(m == _mixtureList.length);

		var pcent = i / (_flockSize - 1);
		this.list.push( {
			speed: Math.random() * 4.0 + 4.0 * pcent + _mixtureList[m].speed,
			x: pbRenderer.width + 350 + Math.random() * 800,
			y: pbRenderer.height * 0.30 + pbRenderer.height * 0.50 * pcent + _mixtureList[m].yoff,
			r: 0,
			scale: (0.30 + 0.70 * pcent) * _mixtureList[m].size,
			textureNumber: _mixtureList[m].texture
		});
	}
};


pbCreatureFlockDemo.prototype.update = function()
{
	// update the creature manager for a given time interval
	var e = this.renderer.rootTimer.elapsedTime;
	this.new_manager.Update(e / 1000 * 2.0);
	this.new_manager2.Update(e / 1000 * 3.0);

	// recalculate this creature's point data
	this.new_creature_renderer.UpdateData();
	this.new_creature_renderer2.UpdateData();

	// draw the creatures with webgl
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.rttRenderbuffer);
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    var transform = pbMatrix3.makeTransform(-0.15, 0.0, 0.0, 0.04, 0.04);
	this.new_creature_renderer.DrawCreature(transform, this.renderer.graphics, this.stripShaderProgram, this.creatureTextureNumber);

	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer2);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.rttRenderbuffer2);
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	transform = pbMatrix3.makeTransform(-0.15, 0.0, 0.0, 0.03, 0.03);
	this.new_creature_renderer2.DrawCreature(transform, this.renderer.graphics, this.stripShaderProgram, this.creatureTextureNumber);

	// don't render to texture any more, render to the display instead (this means you, background sprite!)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
};


pbCreatureFlockDemo.prototype.postUpdate = function()
{
	for(var i = 0, l = this.list.length; i < l; i++)
	{
		var o = this.list[i];
		// draw the creature
		var transform = pbMatrix3.makeTransform(o.x, o.y, o.r, o.scale, o.scale);
		this.renderer.graphics.drawTextureWithTransform( o.textureNumber, this.textureList[o.textureNumber], transform, 1.0 );
		o.x -= o.speed;
		if (o.x < -300) o.x = pbRenderer.width + 350 + Math.random() * 100;
	}
};

