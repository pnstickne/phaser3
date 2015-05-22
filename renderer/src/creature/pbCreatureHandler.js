/**
 * pbCreatureHandler
 *
 * helper layer to simplify the creation and manipulation of multiple 'Creature' objects
 * 
 */


function pbCreatureHandler(_renderer, _shaderProgram)
{
	this.renderer = _renderer;
	this.shaderProgram = _shaderProgram;
	this.dictionary = null;
}


pbCreatureHandler.prototype.constructor = pbCreatureHandler;


/**
 * Create - create a new type of creature and name it
 *
 * @param {[type]} name    [description]
 * @param {[type]} json    [description]
 * @param {[type]} textureImage [description]
 */
pbCreatureHandler.prototype.Create = function(name, json, textureImage, srcTextureRegister, dstTextureRegister, transform, animSpeed)
{
	console.log("pbCreatureHandler.Create " + name);

	if (!this.dictionary)
	{
		this.dictionary = new pbDictionary();
		this.dictionary.create();
	}

	if (this.dictionary.exists(name))
	{
		console.log("ERROR: duplicate creature name: " + name + "!");
		return;
	}

	// create the creature
	var new_creature = new Creature(json, textureImage);
	// create an animation object for it
	var new_animation = new CreatureAnimation(json, "default", new_creature);
	// create a creature manager for it
	var new_manager = new CreatureManager(new_creature);
	// add the animation to the manager
	new_manager.AddAnimation(new_animation);
	// prepare the manager settings
	new_manager.SetActiveAnimationName("default", false);
	new_manager.SetShouldLoop(true);
	new_manager.SetIsPlaying(true);
	new_manager.RunAtTime(0);

	// prepare a cache of points to speed up the playback
	// WARNING: slow - 4 seconds for one animation of the Utah Raptor
	//new_manager.MakePointCache("default");

	// create the creature renderer using the manager and the texture
	var new_renderer = new CreatureRenderer(new_manager, textureImage.imageData);

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	var rttTexture = pbWebGlTextures.initTexture(dstTextureRegister, pbRenderer.width, pbRenderer.height);
	var rttRenderbuffer = pbWebGlTextures.initDepth(rttTexture);
	var rttFramebuffer = pbWebGlTextures.initFramebuffer(rttTexture);

	// add this new creature to the dictionary of creature types
	var data = {
		creature: new_creature,
		animation: new_animation,
		manager: new_manager,
		renderer: new_renderer,
		transform: transform,
		animSpeed: animSpeed,
		srcTextureRegister: srcTextureRegister,
		dstTextureRegister: dstTextureRegister,
		dstTexture: rttTexture,
		frameBuffer: rttFramebuffer,
		depthBuffer: rttRenderbuffer,
		list: null
	};

	this.dictionary.add(name, data);
};


/**
 * Add - add a new instance of the named creature
 *
 * @param {[type]} name [description]
 * @param {[type]} x    [description]
 * @param {[type]} y    [description]
 */
pbCreatureHandler.prototype.Add = function(name, x, y, r, scale, speed)
{
	if (this.dictionary.exists(name))
	{
		var type = this.dictionary.getFirst(name);
		
		if (!type.list)
			type.list = [];

		var data = {
			// values per instance of a given creature type
			x: x,
			y: y,
			r: r,
			scale: scale,
			speed: speed,
			// carry over some 'creature type' values to make drawing each instance faster
			textureNumber: type.dstTextureRegister,
			texture: type.dstTexture
		};

		type.list.push(data);
	}
	else
	{
		console.log("ERROR: attempting to add an unknown creature: " + name + "!");
	}
};


/**
 * Update - update all creature types
 *
 * @param {[type]} timeInterval [description]
 */
pbCreatureHandler.prototype.Update = function(timeInterval)
{
	this.timeInterval = timeInterval;
	this.dictionary.iterateKeys(this.updateType, this);
};


pbCreatureHandler.prototype.updateType = function(creatures)
{
	// there's only one dictionary entry per type
	var creatureData = creatures[0];

	// update the creature manager for this type
	creatureData.manager.Update(this.timeInterval * creatureData.animSpeed);

	// recalculate the creatures' point data
	creatureData.renderer.UpdateData();

	// draw the creatures with webgl
	gl.bindFramebuffer(gl.FRAMEBUFFER, creatureData.frameBuffer);
	gl.bindRenderbuffer(gl.RENDERBUFFER, creatureData.depthbuffer);

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	creatureData.renderer.DrawCreature(creatureData.transform, this.renderer.graphics, this.shaderProgram, creatureData.srcTextureRegister);
};


/**
 * GetAll - get all creature instances in a list
 */
pbCreatureHandler.prototype.GetAll = function()
{
	var creatureList = [];

	// for each key (a creature type), copy the list contents (the instances of that creature) into creatureList
	this.dictionary.iterateKeys(function getList(_data) {
			for(var i = 0, l = _data[0].list.length; i < l; i++)
				creatureList.push(_data[0].list[i]);
		}, this);

	return creatureList;
};

