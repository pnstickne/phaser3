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
	this.rocketImg = this.loader.loadImage( "../img/invader/rockets32x32x8.png" );
	this.smokeImg = this.loader.loadImage( "../img/invader/smoke64x64x8.png" );
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
	this.player.die = false;
	this.playerDirX = 2;

	// player bullets
	image = this.loader.getImage( this.bulletImg );
	this.bulletSurface = new pbSurface();
	this.bulletSurface.create(0, 0, 1, 1, image);
	this.bulletPool = [];		// pool for bullets which aren't firing
	this.bullets = [];			// list of bullets which are firing
	for(var i = 0; i < 100; i++)
	{
		var img = new pbImage();
		// anchor point at front of bullet for easy collisions...
		img.create(this.renderer, this.bulletSurface, 0, 0.5, 0.0);
		var bullet = new pbSprite();
		bullet.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the rootLayer until it's fired
		this.bulletPool.push(bullet);
	}

	// player rockets
	image = this.loader.getImage( this.rocketImg );
	this.rocketSurface = new pbSurface();
	this.rocketSurface.create(32, 32, 8, 1, image);
	this.rocketPool = [];		// pool for rockets which aren't firing
	this.rockets = [];			// list of rockets which are firing
	for(var i = 0; i < 100; i++)
	{
		var img = new pbImage();
		// anchor point at front of rocket for easy collisions...
		img.create(this.renderer, this.rocketSurface, 0, 0.5, 0.0);
		var rocket = new pbSprite();
		rocket.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the rootLayer until it's fired
		this.rocketPool.push(rocket);
	}

	// aliens
	image = this.loader.getImage( this.invaderImg );
	this.invaderSurface = new pbSurface();
	this.invaderSurface.create(32, 32, 4, 1, image);
	this.addInvaders();

	// alien bombs
	image = this.loader.getImage( this.bombImg );
	this.bombSurface = new pbSurface();
	this.bombSurface.create(0, 0, 1, 1, image);
	this.bombPool = [];			// pool for bombs which aren't firing
	this.bombs = [];			// list of bombs which are firing
	for(var i = 0; i < 100; i++)
	{
		var img = new pbImage();
		img.create(this.renderer, this.bombSurface, 0);
		var bomb = new pbSprite();
		bomb.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the rootLayer until it's fired
		this.bombPool.push(bomb);
	}
	// record the nearest bomb to the player's position (so he can try to dodge)
	this.nearest = null;

	// explosions
	image = this.loader.getImage( this.explosionImg );
	this.explosionSurface = new pbSurface();
	this.explosionPool = [];
	this.explosions = [];
	this.explosionSurface.create(128, 128, 16, 1, image);
	for(var i = 0; i < 100; i++)
	{
		var img = new pbImage();
		img.create(this.renderer, this.explosionSurface, 0);
		var explosion = new pbSprite();
		explosion.create(img, 0, 0, 0, 0, 0.5, 0.5);
		this.explosionPool.push(explosion);
	}

	// smoke puffs
	image = this.loader.getImage( this.smokeImg );
	this.smokeSurface = new pbSurface();
	this.smokePool = [];
	this.smokes = [];
	this.smokeSurface.create(64, 64, 8, 1, image);
	for(var i = 0; i < 200; i++)
	{
		var img = new pbImage();
		img.create(this.renderer, this.smokeSurface, 0);
		var smoke = new pbSprite();
		smoke.create(img, 0, 0, 0, 0, 1.0, 1.0);
		this.smokePool.push(smoke);
	}
};


pbAutoInvaderDemo.prototype.addInvaders = function()
{
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
			invader.die = false;
			this.invaders.push(invader);
		}
	this.moveY = 4;
	this.invaderDirX = 8;
	this.flipDir = false;
};


pbAutoInvaderDemo.prototype.update = function()
{
	// scroll the background by adjusting the start point of the texture read y coordinate
	this.bgSurface.cellTextureBounds[0][0].y -= 1 / this.renderer.height;


	//
	// update player
	//
	if (this.player.die)
	{
		// TODO: life lost
		this.player.x = this.renderer.width * 0.5;
		this.playerDirX = 2;
		this.player.die = false;
	}
	if (this.nearest)
	{
		// dodge the nearest bomb
		if (this.player.x > this.nearest.x) this.playerDirX = Math.abs(this.playerDirX);
		else this.playerDirX = -Math.abs(this.playerDirX);
	}
	// bounce off edges
	if (this.player.x < this.player.image.surface.cellWide * 0.5
		|| this.player.x > this.renderer.width - this.player.image.surface.cellWide * 0.5)
		this.playerDirX = -this.playerDirX;
	// move
	this.player.x += this.playerDirX;
	// fire player bullet
	if (Math.random() < 0.1)
		if (this.bulletPool.length > 0)
			this.playerShoot();
	// fire player rocket
	if (Math.random() < 0.02)
		if (this.rocketPool.length > 0)
			this.playerShootRocket( (Math.random() < 0.5) );

	// create new field of invaders if they've all been killed
	if (this.invaders.length === 0)
		this.addInvaders();

	// update invaders
	for(var i = this.invaders.length - 1; i >= 0; --i)
	{
		var invader = this.invaders[i];

		if (this.moveY == invader.row)
		{
			// movement
			invader.x += this.invaderDirX;
			if (invader.x < invader.image.surface.cellWide * 0.5
				|| invader.x > this.renderer.width - invader.image.surface.cellWide * 0.5)
				this.flipDir = true;

			// invader dropping bomb
			if (Math.random() < 0.02)
				if (this.bombPool.length > 0)
					this.invaderBomb(invader);
		}

		// animation
		invader.image.cellFrame += 0.2;
		if (invader.image.cellFrame >= 4) invader.image.cellFrame = 0;

		if (invader.die)
		{
			// TODO: death effect for invaders
			rootLayer.removeChild(invader);
			this.invaders.splice(i, 1);
		}
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

	// update active munitions
	this.playerBulletMove();
	this.playerRocketMove();
	this.invaderBombMove();

	// update effects
	this.updateExplosions();
	this.updateSmokes();
};


pbAutoInvaderDemo.prototype.playerShoot = function()
{
	var b = this.bulletPool.pop();
	b.x = this.player.x;
	b.y = this.player.y;
	rootLayer.addChild(b);

	this.bullets.push(b);
};


pbAutoInvaderDemo.prototype.playerShootRocket = function(_left)
{
	var target = this.pickTarget();
	if (target)
	{
		var b = this.rocketPool.pop();
		b.target = target;
		if (_left)
		{
			b.x = this.player.x - 8;
			b.angle = 1.5 * Math.PI - 0.1;
		}
		else
		{
			b.x = this.player.x + 8;
			b.angle = 1.5 * Math.PI + 0.1;
		}
		b.y = this.player.y;
		b.velocity = 1;
		rootLayer.addChild(b);

		this.rockets.push(b);
	}
};


pbAutoInvaderDemo.prototype.pickTarget = function()
{
	if (this.invaders.length === 0) return null;
	var i = Math.floor(this.invaders.length * Math.random());
	return this.invaders[i];
};


pbAutoInvaderDemo.prototype.playerBulletMove = function()
{
	for(var i = this.bullets.length - 1; i >= 0; --i)
	{
		var b = this.bullets[i];
		b.y -= 8;

		// hit alien or off the top of the screen?
		if (this.invaderCollide(b.x, b.y, true) || b.y < -b.image.surface.cellHigh)
		{
			// kill the bullet and add it back to the pool
			rootLayer.removeChild(b);
			this.bulletPool.push(b);
			this.bullets.splice(i, 1);
		}
	}
};


pbAutoInvaderDemo.prototype.playerRocketMove = function()
{
	for(var i = this.rockets.length - 1; i >= 0; --i)
	{
		var b = this.rockets[i];
		var cos = Math.cos(b.angle);
		var sin = Math.sin(b.angle);
		b.x += b.velocity * cos;
		b.y += b.velocity * sin;
		b.velocity += 0.1;

		if (b.angle < 0) b.angle += Math.PI * 2.0;
		if (b.angle >= Math.PI * 2.0) b.angle -= Math.PI * 2.0;
		b.image.cellFrame = Math.floor((b.angle - Math.PI * 0.5) / (Math.PI * 0.5) * 2 + 0.5);
		if (b.image.cellFrame < 0) b.image.cellFrame += 8;

		if (Math.random() < 0.5)
		{
			var angle = ((b.image.cellFrame + 6) % 8) / 8.0 * Math.PI * 2.0;
			this.addSmoke(b.x + 16 * Math.cos(angle), b.y + 16 * Math.sin(angle));
		}

		if (b.target)
		{
			if (b.target.die)
			{
				this.addExplosion(b.x, b.y);
				b.y = -100;
			}
			else
			{
				var dx = b.target.x - b.x;
				var dy = b.target.y - b.y;
				var a = Math.atan2(dy, dx);		// desired angle
				var d = a - b.angle;
				b.angle = a;	//+= Math.min(0.1, Math.max(-0.1, d));
			}
		}


		// hit alien or off the top of the screen?
		if (this.invaderCollide(b.x, b.y, true) || b.y < -b.image.surface.cellHigh)
		{
			// kill the bullet and add it back to the pool
			rootLayer.removeChild(b);
			this.rocketPool.push(b);
			this.rockets.splice(i, 1);
		}
	}
};


pbAutoInvaderDemo.prototype.invaderCollide = function(_x, _y, _explode)
{
	for(var i = 0, l = this.invaders.length; i < l; i++)
	{
		var invader = this.invaders[i];
		var w2 = invader.image.surface.cellWide * 0.5;
		if (_x > invader.x - w2 && _x < invader.x + w2)
		{
			var h2 = invader.image.surface.cellHigh * 0.5;
			if (_y > invader.y - h2 && _y < invader.y + h2)
			{
				if (_explode)
				{
					this.addExplosion(invader.x, invader.y);
					invader.die = true;
				}
				return true;
			}
		}
	}
	return false;
};


pbAutoInvaderDemo.prototype.invaderBomb = function(_invader)
{
	var b = this.bombPool.pop();
	b.x = _invader.x;
	b.y = _invader.y;
	rootLayer.addChild(b);

	this.bombs.push(b);
};


pbAutoInvaderDemo.prototype.invaderBombMove = function()
{
	this.nearest = null;
	var nearDist2 = 0xffffffff;

	for(var i = this.bombs.length - 1; i >= 0; --i)
	{
		var b = this.bombs[i];
		b.y += 2;

		var hit = false;
		var w2 = this.player.image.surface.cellWide * 0.5;
		if (b.x > this.player.x - w2 && b.x < this.player.x + w2)
		{
			var h2 = this.player.image.surface.cellHigh * 0.5;
			if (b.y > this.player.y - h2 && b.y < this.player.y + h2)
			{
				this.addExplosion(this.player.x, this.player.y);
				this.player.die = true;
				hit = true;
			}
		}

		var dx = this.player.x - b.x;
		var dy = this.player.y - b.y;
		var d2 = dx * dx + dy * dy;
		if (d2 < nearDist2 && d2 < 40 * 40)
		{
			this.nearest = b;
			nearDist2 = d2;
		}

		// hit player or off the bottom of the screen?
		if (hit || b.y > this.renderer.height + b.image.surface.cellHigh * 0.5)
		{
			// kill the bullet and add it back to the pool
			rootLayer.removeChild(b);
			this.bombPool.push(b);
			this.bombs.splice(i, 1);
		}
	}
};


pbAutoInvaderDemo.prototype.addExplosion = function(_x, _y)
{
	if (this.explosionPool.length > 0)
	{
		var explosion = this.explosionPool.pop();
		explosion.x = _x;
		explosion.y = _y;
		explosion.image.cellFrame = 0;
		rootLayer.addChild(explosion);
		this.explosions.push(explosion);
	}
};


pbAutoInvaderDemo.prototype.updateExplosions = function()
{
	for(var i = this.explosions.length - 1; i >= 0; --i)
	{
		var explosion = this.explosions[i];
		explosion.image.cellFrame += 0.2;
		if (explosion.image.cellFrame >= 16)
		{
			rootLayer.removeChild(explosion);
			this.explosions.splice(i, 1);
			this.explosionPool.push(explosion);
		}
	}
};


pbAutoInvaderDemo.prototype.addSmoke = function(_x, _y)
{
	if (this.smokePool.length > 0)
	{
		var smoke = this.smokePool.pop();
		smoke.x = _x;
		smoke.y = _y;
		smoke.image.cellFrame = 0;
		rootLayer.addChild(smoke);
		this.smokes.push(smoke);
	}
};


pbAutoInvaderDemo.prototype.updateSmokes = function()
{
	for(var i = this.smokes.length - 1; i >= 0; --i)
	{
		var smoke = this.smokes[i];
		smoke.image.cellFrame += 0.2;
		if (smoke.image.cellFrame >= 8)
		{
			rootLayer.removeChild(smoke);
			this.smokes.splice(i, 1);
			this.smokePool.push(smoke);
		}
	}
};


