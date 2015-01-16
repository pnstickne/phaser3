/**
 *
 * The auto-invaders demo for the new Phaser 3 renderer.
 *
 */


/* jshint laxbreak: true */	// tell jshint to just shut-up already about my choice of line format



// created while the data is loading (preloader)
function pbAutoInvaderDemo( docId )
{
	console.log( "pbAutoInvaderDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.playerImg = this.loader.loadImage( "../img/invader/player.png" );
	this.invaderImg = this.loader.loadImage( "../img/invader/invader32x32x4.png" );
	this.saucerImg = this.loader.loadImage( "../img/invader/invader.png" );
	this.starsImg = this.loader.loadImage( "../img/invader/starfield.png" );
	this.bulletImg = this.loader.loadImage( "../img/invader/bullet.png" );
	this.bombImg = this.loader.loadImage( "../img/invader/enemy-bullet.png" );
	this.explosionImg = this.loader.loadImage( "../img/invader/explode.png" );

	console.log( "pbAutoInvaderDemo c'tor exit" );
}


pbAutoInvaderDemo.prototype.allLoaded = function()
{
	console.log( "pbAutoInvaderDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );
};


pbAutoInvaderDemo.prototype.create = function()
{
	console.log("pbAutoInvaderDemo.create");

	this.addSprites();
};


pbAutoInvaderDemo.prototype.destroy = function()
{
	console.log("pbAutoInvaderDemo.destroy");

	this.bgSurface.destroy();
	this.bgSurface = null;

	this.renderer.destroy();
	this.renderer = null;
};


pbAutoInvaderDemo.prototype.restart = function()
{
	console.log("pbAutoInvaderDemo.restart");
	
	this.destroy();
	this.create();
};


pbAutoInvaderDemo.prototype.addSprites = function()
{
	console.log("pbAutoInvaderDemo.addSprites");

	// TODO: use different pbLayers for each part of this demo

	// background
	var image = this.loader.getImage( this.starsImg );
	this.bgSurface = new pbSurface();
	this.bgSurface.create(0, 0, 1, 1, image);
	this.bgImage = new pbImage();
	this.bgImage.create(this.renderer, this.bgSurface, 0, 0, 0, true, true);
	this.bg = new pbSprite();
	this.bg.create(this.bgImage, 0, 0, 1, 0, 1.0, 1.0);
	rootLayer.addChild(this.bg);

	// player
	image = this.loader.getImage( this.playerImg );
	this.playerSurface = new pbSurface();
	this.playerSurface.create(0, 0, 1, 1, image);
	this.playerImage = new pbImage();
	this.playerImage.create(this.renderer, this.playerSurface, 0);
	this.player = new pbSprite();
	this.player.create(this.playerImage, this.renderer.width * 0.5, this.renderer.height * 0.9, 0, 0, 1.0, 1.0);
	rootLayer.addChild(this.player);
	this.playerDirX = 2;

	// aliens
	image = this.loader.getImage( this.invaderImg );
	this.invaderSurface = new pbSurface();
	this.invaderSurface.create(32, 32, 4, 1, image);
	this.invaders = [];
	for(var y = 0; y < 5; y++)
		for(var x = 0; x < 12; x++)
		{
			var img = new pbImage();
			img.create(this.renderer, this.invaderSurface, Math.floor(Math.random() * 3));
			var invader = new pbSprite();
			invader.create(img, 20 + x * 48, 80 + y * 48, 0, 0, 1.0, 1.0);
			rootLayer.addChild(invader);
			invader.row = y;
			this.invaders.push(invader);
		}
	this.moveY = 4;
	this.invaderDirX = 8;
	this.flipDir = false;

	// player bullets
	image = this.loader.getImage( this.bulletImg );
	this.bulletSurface = new pbSurface();
	this.bulletSurface.create(0, 0, 1, 1, image);
	this.bulletPool = [];		// pool for bullets which aren't firing
	this.bullets = [];			// list of bullets which are firing
	for(var i = 0; i < 100; i++)
	{
		var img = new pbImage();
		img.create(this.renderer, this.bulletSurface, 0);
		var bullet = new pbSprite();
		bullet.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the rootLayer until it's fired
		this.bulletPool.push(bullet);
	}


};


pbAutoInvaderDemo.prototype.update = function()
{
	// scroll the background by adjusting the start point of the texture read y coordinate
	this.bgSurface.cellTextureBounds[0][0].y -= 1 / this.renderer.height;

	// update player
	this.player.x += this.playerDirX;
	if (this.player.x < this.player.image.surface.cellWide * 0.5
		|| this.player.x > this.renderer.width - this.player.image.surface.cellWide * 0.5)
		this.playerDirX = -this.playerDirX;

	// player shooting new bullet
	if (Math.random() < 0.1)
		if (this.bulletPool.length > 0)
			this.playerShoot();

	// update active player bullets
	this.playerBulletMove();

	// update invaders
	for(var i = 0, l = this.invaders.length; i < l; i++)
	{
		if (this.moveY == this.invaders[i].row)
		{
			// movement
			this.invaders[i].x += this.invaderDirX;
			if (this.invaders[i].x < this.invaders[i].image.surface.cellWide * 0.5
				|| this.invaders[i].x > this.renderer.width - this.invaders[i].image.surface.cellWide * 0.5)
				this.flipDir = true;
		}

		// animation
		this.invaders[i].image.cellFrame += 0.2;
		if (this.invaders[i].image.cellFrame >= 4) this.invaders[i].image.cellFrame = 0;
	}

	// ('whole row at once' movement https://www.youtube.com/watch?v=437Ld_rKM2s#t=30)
	this.moveY -= 0.25;
	if (this.moveY < 0)
	{
		this.moveY = 4;
		if (this.flipDir)
			this.invaderDirX = -this.invaderDirX;
		this.flipDir = false;
	}
};


pbAutoInvaderDemo.prototype.playerShoot = function()
{
	var b = this.bulletPool.pop();
	b.x = this.player.x;
	b.y = this.player.y;
	rootLayer.addChild(b);

	this.bullets.push(b);
};


pbAutoInvaderDemo.prototype.playerBulletMove = function()
{
	for(var i = this.bullets.length - 1; i >= 0; --i)
	{
		var b = this.bullets[i];
		b.y -= 8;

		// TODO: check for collisions

		// off the top of the screen?
		if (b.y < -b.image.surface.cellHigh)
		{
			// kill the bullet and add it back to the pool
			rootLayer.removeChild(b);
			this.bulletPool.push(b);
			this.bullets.splice(i, 1);
		}
	}
}

