/**
 *
 * Bunny Mark
 *
 */



// created while the data is loading (preloader)
function pbBunnyDemoNPOT( docId )
{
	console.log( "pbBunnyDemoNPOT c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.numSprites = 0;
	// dat.GUI controlled variables and callbacks
	this.gui = new dat.GUI();
	var numCtrl = this.gui.add(this, "numSprites").min(0).max(MAX_SPRITES).step(250).listen();
	numCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "../img/bunny.png" );

	console.log( "pbBunnyDemoNPOT c'tor exit" );
}


pbBunnyDemoNPOT.prototype.allLoaded = function()
{
	console.log( "pbBunnyDemoNPOT.allLoaded" );

	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );
};


pbBunnyDemoNPOT.prototype.create = function()
{
	console.log("pbBunnyDemoNPOT.create");

	this.list = [];
};


pbBunnyDemoNPOT.prototype.destroy = function()
{
	console.log("pbBunnyDemoNPOT.destroy");

	this.gui.destroy();
	this.list = null;
	this.surface.destroy();
	this.surface = null;

	this.renderer.destroy();
	this.renderer = null;

};


pbBunnyDemoNPOT.prototype.restart = function()
{
	console.log("pbBunnyDemoNPOT.restart");
	
	this.destroy();
	this.create();
};


pbBunnyDemoNPOT.prototype.addSprites = function(num)
{
	// create animation data and set destination for movement
	if (!this.surface)
	{
		var image = this.loader.getFile( this.spriteImg );
		this.surface = new pbSurface();
		this.surface.create(0, 0, 1, 1, image);
		this.surface.isNPOT = true;
	}

	for(var i = 0; i < num; i++)
	{
		var img = new pbImage();
		img.create(this.surface, 0, 0.5, 1.0);
		img.isParticle = true;			// use fast batch drawing, object doesn't rotate

		var spr = new pbSprite();
		spr.create(img, 13, 37, 1.0, 0, 1.0, 1.0);
		rootLayer.addChild(spr);

		this.list.push( { sprite:spr, vx:Math.random() * 10, vy:(Math.random() * 10) - 5 });
	}

	this.numSprites = this.list.length;
};


pbBunnyDemoNPOT.prototype.removeSprites = function(num)
{
	for( var i = 0; i < num; i++ )
	{
		if (this.list.length > 0)
		{
			var obj = this.list[this.list.length - 1];
			obj.sprite.destroy();
		}

		this.list.pop();
	}
	this.numSprites = this.list.length;
};


pbBunnyDemoNPOT.prototype.update = function()
{
	for(var i = 0, l = this.list.length; i < l; i++)
	{
		var obj = this.list[i];
		var spr = obj.sprite;
		spr.x += obj.vx;
		spr.y += obj.vy;
		obj.vy += 0.75;
		if (spr.x < 13)
		{
			spr.x = 13;
			obj.vx = -obj.vx;
		}
		else if (spr.x > this.renderer.width - 13)
		{
			spr.x = this.renderer.width - 13;
			obj.vx = -obj.vx;
		}
		if (spr.y >= this.renderer.height)
		{
			spr.y = this.renderer.height;
			obj.vy *= - 0.85;
			if (Math.random() > 0.5)
			{
				obj.vy -= Math.random() * 6;
			}			
		}
		if (spr.y < 0)
		{
			spr.y = 0;
			obj.vy = 0;
		}
	}

	if (fps > 59 && (this.renderer.frameCount & 7) === 0)
	{
	 	this.addSprites(500);
	}

	if (fps > 0 && fps < 55)
	{
	 	this.removeSprites(10);
	}
};

