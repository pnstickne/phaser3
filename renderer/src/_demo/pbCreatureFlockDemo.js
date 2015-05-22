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
	this.creatures = null;

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

    // get the source texture from the textures dictionary using 'key'
    this.dinoTexture = textures.getFirst("dino");

	// unzip the compressed data file and create the animation JSON data structure
	var zip = new JSZip( this.loader.getFile( this.dinoZip ).response );
	var dinoJSON = zip.file("character_data.json").asText();
	var dinoData = JSON.parse(dinoJSON);

	this.creatures = new pbCreatureHandler(this.renderer, this.stripShaderProgram);

	// create a transform to be applied when drawing a creature to the render-to-texture on the GPU
	// this controls the offset, rotation and size of the creature's raw sprite source
    var transform = pbMatrix3.makeTransform(-0.15, 0.0, 0.0, 0.04, 0.04);
    // add the big dino type
	this.creatures.Create("big_dino", dinoData, this.dinoTexture, 1, 2, transform, 1.0 );

	// add the small dino type
    transform = pbMatrix3.makeTransform(-0.15, 0.2, 0.0, 0.02, 0.02);
	this.creatures.Create("little_dino", dinoData, this.dinoTexture, 1, 3, transform, 1.5 );

	// make the flock
	this.makeFlock(30);

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


pbCreatureFlockDemo.prototype.makeFlock = function(_flockSize)
{
	var name, speed;
	for(var i = 0; i < _flockSize; i++)
	{
		// make more small ones than big ones
		if (Math.random() < 0.8)
		{
			name = "little_dino";
			speed = 7.0;
		}
		else
		{
			name = "big_dino";
			speed = 4.0;
		}

		// handy scaling factor to create a fake depth illusion with perspective
		var pcent = i / (_flockSize - 1);
		this.creatures.Add(
				name,
				pbRenderer.width + 350 + Math.random() * 800, // x
				pbRenderer.height * 0.30 + pbRenderer.height * 0.50 * pcent,  // y
				0, // rotation
				(0.30 + 0.70 * pcent), // scale
				Math.random() * 4.0 + 4.0 * pcent + speed  // speed
			);
	}
};


pbCreatureFlockDemo.prototype.update = function()
{
	// update the creatures and render them to GPU textures
	var e = this.renderer.rootTimer.elapsedTime;
	this.creatures.Update(e / 1000 * 2.0);

	// render to the display from now on (pbRenderer.update: rootLayer.update)
	// without this all other sprites in the scene will render to the last bound texture
	// TODO: this should be parameterised in pbRenderer and set before the rootLayer.update call
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
};


/**
 * postUpdate - called after pbRenderer does rootLayer.update
 * display all of the creature sprite images by rendering to the display from their render-to-textures on the GPU
 *
 * @return {[type]} [description]
 */
pbCreatureFlockDemo.prototype.postUpdate = function()
{
	// get all the creature instances
	var list = this.creatures.GetAll();

	// sort them into descending y coordinates to preserve depth illusion
	list.sort(function(first, second) { return first.y - second.y; });

	// draw them from their GPU texture sources to the display
	for(var i = 0, l = list.length; i < l; i++)
	{
		var o = list[i];
		// draw the creature sprite
		var transform = pbMatrix3.makeTransform(o.x, o.y, o.r, o.scale, o.scale);
		this.renderer.graphics.drawTextureWithTransform( o.textureNumber, o.texture, transform, 1.0 );
		o.x -= o.speed;
		if (o.x < -300) o.x = pbRenderer.width + 350 + Math.random() * 100;
	}
};

