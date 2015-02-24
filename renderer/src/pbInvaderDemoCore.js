/**
 *
 * The auto-invaders demo core for the new Phaser 3 renderer.
 *
 */


/* jshint laxbreak: true */	// tell jshint to just shut-up already about my choice of line format



// created while the data is loading (preloader)
function pbInvaderDemoCore()
{
	console.log( "pbInvaderDemoCore c'tor entry" );

	var _this = this;

	this.layer = null;
	this.uiLayer = null;
	this.textSurface = null;
	this.text = null;
	this.score = 0;
	this.level = 0;
	this.parent = null;

	console.log( "pbInvaderDemoCore c'tor exit" );
}


pbInvaderDemoCore.prototype.create = function(_parent, _rootLayer)
{
	console.log("pbInvaderDemoCore.create");

	this.parent = _parent;

	this.layer = _rootLayer;
	this.uiLayer = new layerClass();
	this.uiLayer.create(this.layer, this.parent.renderer, 0, 0, 0, 0, 1, 1);
	this.layer.addChild(this.uiLayer);

	var image = this.parent.loader.getFile( this.parent.fontImg );
	image = imageToPowerOfTwo(image);
	this.textSurface = new pbSurface();
	this.textSurface.create(16, 16, 95, 7, image);		// there are 7 rows of 95 characters which are 16x16 pixels each, first character is Space

	this.text = new pbText();
	this.text.create(this.textSurface, this.uiLayer, " ".charCodeAt(0));
	this.scoreLine = this.text.addLine("SCORE 000000", 20, 20, 16);
	this.levelLine = this.text.addLine("LEVEL 001", this.parent.renderer.width - 20 - 9 * 16, 20, 16);

	this.score = 0;
	this.level = 1;
	this.invaderSpeed = 10;

	this.addSprites();
};


pbInvaderDemoCore.prototype.destroy = function()
{
	console.log("pbInvaderDemoCore.destroy");

	this.bgSurface.destroy();
	this.bgSurface = null;

	this.text.destroy();
	this.text = null;

	this.uiLayer.destroy();
	this.uiLayer = null;

	this.textSurface.destroy();
	this.textSurface = null;

	this.layer = null;
};


pbInvaderDemoCore.prototype.restart = function()
{
	console.log("pbInvaderDemoCore.restart");
	
	this.destroy();
	this.create();
};


pbInvaderDemoCore.prototype.addSprites = function()
{
	console.log("pbInvaderDemoCore.addSprites");

	// TODO: use different pbLayers for each part of this demo

	// background
	var image = this.parent.loader.getFile( this.parent.starsImg );
	this.bgSurface = new pbSurface();
	this.bgSurface.create(0, 0, 1, 1, image);
	this.bgImage = new imageClass();
	this.bgImage.create(this.bgSurface, 0, 0, 0, true, true);
	this.bg = new pbSprite();
	this.bg.create(this.bgImage, 0, 0, 1, 0, 1.0, 1.0);
	this.layer.addChild(this.bg);

	// player
	image = this.parent.loader.getFile( this.parent.playerImg );
	this.playerSurface = new pbSurface();
	this.playerSurface.create(0, 0, 1, 1, image);
	this.playerImage = new imageClass();
	this.playerImage.create(this.playerSurface, 0);
	this.player = new pbSprite();
	this.player.create(this.playerImage, this.parent.renderer.width * 0.5, this.parent.renderer.height * 0.9, 0, 0, 1.0, 1.0);
	this.layer.addChild(this.player);
	this.player.die = false;
	this.playerDirX = -2;

	// player bullets
	image = this.parent.loader.getFile( this.parent.bulletImg );
	this.bulletSurface = new pbSurface();
	this.bulletSurface.create(0, 0, 1, 1, image);
	this.bulletPool = [];		// pool for bullets which aren't firing
	this.bullets = [];			// list of bullets which are firing
	for(var i = 0; i < 100; i++)
	{
		var img = new imageClass();
		// anchor point at front of bullet for easy collisions...
		img.create(this.bulletSurface, 0, 0.5, 0.0);
		var bullet = new pbSprite();
		bullet.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the layer until it's fired
		this.bulletPool.push(bullet);
	}

	// player rockets
	image = this.parent.loader.getFile( this.parent.rocketImg );
	this.rocketSurface = new pbSurface();
	this.rocketSurface.create(32, 32, 8, 1, image);
	this.rocketPool = [];		// pool for rockets which aren't firing
	this.rockets = [];			// list of rockets which are firing
	for(var i = 0; i < 100; i++)
	{
		var img = new imageClass();
		img.create(this.rocketSurface, 0, 0.5, 0.5);
		var rocket = new pbSprite();
		rocket.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the layer until it's fired
		this.rocketPool.push(rocket);
	}

	// aliens
	image = this.parent.loader.getFile( this.parent.invaderImg );
	this.invaderSurface = new pbSurface();
	this.invaderSurface.create(32, 32, 4, 1, image);
	this.addInvaders();

	// alien bombs
	image = this.parent.loader.getFile( this.parent.bombImg );
	this.bombSurface = new pbSurface();
	this.bombSurface.create(0, 0, 1, 1, image);
	this.bombPool = [];			// pool for bombs which aren't firing
	this.bombs = [];			// list of bombs which are firing
	for(var i = 0; i < 100; i++)
	{
		var img = new imageClass();
		img.create(this.bombSurface, 0);
		var bomb = new pbSprite();
		bomb.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the layer until it's fired
		this.bombPool.push(bomb);
	}
	// record the nearest bomb to the player's position (so he can try to dodge)
	this.nearest = null;

	// explosions
	image = this.parent.loader.getFile( this.parent.explosionImg );
	this.explosionSurface = new pbSurface();
	this.explosionPool = [];
	this.explosions = [];
	this.explosionSurface.create(128, 128, 16, 1, image);
	for(var i = 0; i < 100; i++)
	{
		var img = new imageClass();
		img.create(this.explosionSurface, 0);
		var explosion = new pbSprite();
		explosion.create(img, 0, 0, 0, 0, 0.5, 0.5);
		this.explosionPool.push(explosion);
	}

	// smoke puffs
	image = this.parent.loader.getFile( this.parent.smokeImg );
	this.smokeSurface = new pbSurface();
	this.smokePool = [];
	this.smokes = [];
	this.smokeSurface.create(64, 64, 8, 1, image);
	for(var i = 0; i < 200; i++)
	{
		var img = new imageClass();
		img.create(this.smokeSurface, 0);
		var smoke = new pbSprite();
		smoke.create(img, 0, 0, 0, 0, 1.0, 1.0);
		this.smokePool.push(smoke);
	}
};


pbInvaderDemoCore.prototype.addInvaders = function()
{
	this.invaders = [];
	for(var y = 0; y < 5; y++)
		for(var x = 0; x < 12; x++)
		{
			var img = new imageClass();
			img.create(this.invaderSurface, Math.floor(Math.random() * 3));
			var invader = new pbSprite();
			invader.create(img, 20 + x * 48, 80 + y * 48, 0, 0, 1.0, 1.0);
			this.layer.addChild(invader);
			invader.row = y;
			invader.die = false;
			this.invaders.push(invader);
		}
	this.tick = 100;
	this.moveY = 4;
	this.invaderDirX = 8;
	this.invaderMoveY = 0;
	this.flipDir = false;
};


pbInvaderDemoCore.prototype.update = function()
{
	// scroll the background by adjusting the start point of the texture read y coordinate
	this.bgSurface.cellTextureBounds[0][0].y -= 1 / this.parent.renderer.height;


	//
	// update player
	//
	if (this.player.die)
	{
		// TODO: life lost
		this.player.x = this.parent.renderer.width * 0.5;
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
		|| this.player.x > this.parent.renderer.width - this.player.image.surface.cellWide * 0.5)
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
			this.playerShootRocket();

	if (this.invaders.length === 0)
	{
		// create new field of invaders if they've all been killed
		this.addInvaders();
		// next level
		this.level++;
		this.levelLine = this.text.changeLine(this.levelLine, "LEVEL " + padWithZero(this.level, 3));
		// speed them up each level
		this.invaderSpeed = Math.min(10 + this.level * 2, 100);
	}

	// update invaders
	var invader;
	var i = this.invaders.length;
	while(i--)
	{
		invader = this.invaders[i];

		if (this.tick == 100 && this.moveY == invader.row)
		{
			// horizontal movement
			invader.x += this.invaderDirX;
			if (invader.x < invader.image.surface.cellWide * 0.5
				|| invader.x > this.parent.renderer.width - invader.image.surface.cellWide * 0.5)
				this.flipDir = true;

			// invader dropping bomb
			if (Math.random() < 0.02)
				if (this.bombPool.length > 0)
					this.invaderBomb(invader);
		}

		// vertical movement
		invader.y += this.invaderMoveY;
		if (invader.y > this.parent.renderer.height + invader.image.surface.cellHigh)
			invader.die = true;

		// animation
		invader.image.cellFrame += 0.2;
		if (invader.image.cellFrame >= 4) invader.image.cellFrame = 0;

		if (invader.die)
		{
			this.layer.removeChild(invader);
			this.invaders.splice(i, 1);
		}
	}

	this.invaderMoveY = 0;

	// ('whole row at once' movement https://www.youtube.com/watch?v=437Ld_rKM2s#t=30)
	this.tick -= this.invaderSpeed;
	if (this.tick <= 0)
	{
		this.tick = 100;
		this.moveY--;
		if (this.moveY < 0)
		{
			this.moveY = 4;
			if (this.flipDir)
			{
				// reverse direction
				this.invaderDirX = -this.invaderDirX;
				this.invaderMoveY = 16;
				this.invaderSpeed = Math.min(this.invaderSpeed + 10, 100);
			}
			this.flipDir = false;
		}
	}

	// update active munitions
	this.playerBulletMove();
	this.playerRocketMove();
	this.invaderBombMove();

	// update effects
	this.updateExplosions();
	this.updateSmokes();

	this.scoreLine = this.text.changeLine(this.scoreLine, "SCORE " + padWithZero(this.score, 6));
};


pbInvaderDemoCore.prototype.playerShoot = function()
{
	var b = this.bulletPool.pop();
	b.x = this.player.x;
	b.y = this.player.y - b.image.surface.cellHigh;
	this.layer.addChild(b);

	this.bullets.push(b);
};


pbInvaderDemoCore.prototype.playerBulletMove = function()
{
	var i = this.bullets.length;
	while(i--)
	{
		var b = this.bullets[i];
		b.y -= 8;

		// hit alien or off the top of the screen?
		if (this.invaderCollide(b.x, b.y, true) || b.y < -b.image.surface.cellHigh)
		{
			// kill the bullet and add it back to the pool
			this.layer.removeChild(b);
			this.bulletPool.push(b);
			this.bullets.splice(i, 1);
		}
	}
};


pbInvaderDemoCore.prototype.pickTarget = function()
{
	if (this.invaders.length === 0) return null;
	var i = Math.floor(this.invaders.length * Math.random());
	return this.invaders[i];
};


pbInvaderDemoCore.prototype.playerShootRocket = function()
{
	var target = this.pickTarget();
	if (target)
	{
		var b = this.rocketPool.pop();
		b.target = target;
		if (target.x < this.player.x)
		{
			b.x = this.player.x - 8;
			b.angleInRadians = Math.PI + 0.8;
		}
		else
		{
			b.x = this.player.x + 8;
			b.angleInRadians = Math.PI - 0.8;
		}
		b.image.cellFrame = 0;
		b.y = this.player.y;
		b.velocity = 2;
		this.layer.addChild(b);

		this.rockets.push(b);
	}
};


pbInvaderDemoCore.prototype.playerRocketMove = function()
{
	var i = this.rockets.length;
	while(i--)
	{
		var b = this.rockets[i];

		b.x += b.velocity * Math.sin(b.angleInRadians);
		b.y += b.velocity * Math.cos(b.angleInRadians);
		b.velocity += 0.1;

		if (Math.random() < 0.1 + b.velocity * 0.1)
		{
			this.addSmoke(b.x, b.y);
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
				var desired = Math.atan2(dx, dy);
				if (desired < 0) desired += Math.PI * 2.0;
				if (desired >= Math.PI * 2.0) desired -= Math.PI * 2.0;
				b.angleInRadians = turnToFace(b.angleInRadians, desired, Math.PI * 2.0, 0.04);
			}
		}

		// hit alien or off the edges of the screen?
		if (this.invaderCollide(b.x, b.y, true) || b.y < -b.image.surface.cellHigh || b.x < 0 || b.x > this.parent.renderer.width)
		{
			// kill the rocket and add it back to the pool
			this.layer.removeChild(b);
			this.rocketPool.push(b);
			this.rockets.splice(i, 1);
		}
	}
};


pbInvaderDemoCore.prototype.invaderCollide = function(_x, _y, _explode)
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
					this.score += 10;
				}
				return true;
			}
		}
	}
	return false;
};


pbInvaderDemoCore.prototype.invaderBomb = function(_invader)
{
	var b = this.bombPool.pop();
	b.x = _invader.x;
	b.y = _invader.y;
	b.vy = 2;
	this.layer.addChild(b);

	this.bombs.push(b);
};


pbInvaderDemoCore.prototype.invaderBombMove = function()
{
	this.nearest = null;
	var nearDist2 = 0xffffffff;

	var i = this.bombs.length;
	while(i--)
	{
		var b = this.bombs[i];
		b.y += b.vy;
		b.vy += 0.02;

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
		if (hit || b.y > this.parent.renderer.height + b.image.surface.cellHigh * 0.5)
		{
			// kill the bullet and add it back to the pool
			this.layer.removeChild(b);
			this.bombPool.push(b);
			this.bombs.splice(i, 1);
		}
	}
};


pbInvaderDemoCore.prototype.addExplosion = function(_x, _y)
{
	if (this.explosionPool.length > 0)
	{
		var explosion = this.explosionPool.pop();
		explosion.x = _x;
		explosion.y = _y;
		explosion.image.cellFrame = 0;
		this.layer.addChild(explosion);
		this.explosions.push(explosion);
	}
};


pbInvaderDemoCore.prototype.updateExplosions = function()
{
	var i = this.explosions.length;
	while(i--)
	{
		var explosion = this.explosions[i];
		explosion.image.cellFrame += 0.2;
		if (explosion.image.cellFrame >= 16)
		{
			this.layer.removeChild(explosion);
			this.explosions.splice(i, 1);
			this.explosionPool.push(explosion);
		}
	}
};


pbInvaderDemoCore.prototype.addSmoke = function(_x, _y)
{
	if (this.smokePool.length > 0)
	{
		var smoke = this.smokePool.pop();
		smoke.x = _x;
		smoke.y = _y;
		smoke.image.cellFrame = 0;
		this.layer.addChild(smoke);
		this.smokes.push(smoke);
	}
};


pbInvaderDemoCore.prototype.updateSmokes = function()
{
	var i = this.smokes.length;
	while(i--)
	{
		var smoke = this.smokes[i];
		smoke.image.cellFrame += 0.2;
		if (smoke.image.cellFrame >= 8)
		{
			this.layer.removeChild(smoke);
			this.smokes.splice(i, 1);
			this.smokePool.push(smoke);
		}
	}
};


function turnToFace(_current, _desired, _total, _amount)
{
	var t;
	var d = _desired - _current;
	if (Math.abs(d) <= _total * 0.5)
		t = _current + sgn0(d) * _amount;
	else
		t = _current - sgn0(d) * _amount;
	if (t >= _total) return t - _total;
	if (t < 0) return t + _total;
	return t;
}


function sgn0(_value)
{
	if (_value < 0) return -1;
	if (_value > 0) return 1;
	return 0;
}


function padWithZero(_value, _length)
{
	var s = _value.toString();
	while (s.length < _length)
		s = "0" + s;
	return s;
}
