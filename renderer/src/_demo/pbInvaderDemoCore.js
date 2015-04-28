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
	this.useFrame = false;
	this.parent = null;

	console.log( "pbInvaderDemoCore c'tor exit" );
}


pbInvaderDemoCore.prototype.create = function(_parent, _rootLayer, _useFrame, _separateShadowLayer)
{
	console.log("pbInvaderDemoCore.create");

	if (_separateShadowLayer === undefined)
		_separateShadowLayer = false;

	this.parent = _parent;
	this.useFrame = _useFrame;
	this.shadowLayer = _rootLayer;

	this.layer = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.layer.create(this.layer, this.parent.renderer, 0, 0, 0, 0, 1, 1);
	if (!_separateShadowLayer)
		this.shadowLayer.addChild(this.layer);

	this.uiLayer = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.uiLayer.create(this.layer, this.parent.renderer, 0, 0, 0, 0, 1, 1);
	this.layer.addChild(this.uiLayer);

	var imageData = this.parent.loader.getFile( this.parent.fontImg );
	imageData = imageToPowerOfTwo(imageData);
	this.textSurface = new pbSurface();
	this.textSurface.create(16, 16, 95, 7, imageData);		// there are 7 rows of 95 characters which are 16x16 pixels each, first character is Space

	this.text = new pbText();
	this.text.create(this.textSurface, this.uiLayer, " ".charCodeAt(0));
	this.scoreLine = this.text.addLine("SCORE 000000", 20, 20, 16);
	this.levelLine = this.text.addLine("LEVEL 001", pbRenderer.width - 20 - 9 * 16, 20, 16);

	this.score = 0;
	this.level = 1;
	this.invaderSpeed = 10;

	this.addSprites();
};


pbInvaderDemoCore.prototype.destroy = function()
{
	console.log("pbInvaderDemoCore.destroy");

	if (this.bgSurface)
		this.bgSurface.destroy();
	this.bgSurface = null;

	if (this.text)
		this.text.destroy();
	this.text = null;

	if (this.shadowLayer)
		this.shadowLayer.destroy();
	this.shadowLayer = null;

	if (this.uiLayer)
		this.uiLayer.destroy();
	this.uiLayer = null;

	if (this.textSurface)
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

	var imageData;

	// background
	if (this.parent.starsImg !== undefined)
	{
		imageData = this.parent.loader.getFile( this.parent.starsImg );
		this.bg = new pbSprite(0, 0, imageData, this.layer);
		this.bg.fullScreen = true;
		this.bg.tiling = true;
		// this.bgSurface = new pbSurface();
		// // _wide, _high, _numWide, _numHigh, _image
		// this.bgSurface.create(0, 0, 1, 1, imageData);
		// this.bgImage = new imageClass();
		// // _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
		// this.bgImage.create(this.bgSurface, 0, 0, 0, true, true);
		// this.bg = new pbTransformObject();
		// // _image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
		// this.bg.create(this.bgImage, 0, 0, 1.0, 0, 1.0, 1.0);
		// this.layer.addChild(this.bg);
	}

	// player
	imageData = this.parent.loader.getFile( this.parent.playerImg );
	this.player = new pbSprite(pbRenderer.width * 0.5, pbRenderer.height * 0.9, imageData, this.layer);
	this.player.z = 0.0;
	this.player.anchorX = 0.5;
	this.player.anchorY = 0.5;
	// this.playerSurface = new pbSurface();
	// this.playerSurface.create(0, 0, 1, 1, imageData);
	// this.playerImage = new imageClass();
	// this.playerImage.create(this.playerSurface, 0);
	// this.player = new pbTransformObject();
	// this.player.create(this.playerImage, pbRenderer.width * 0.5, pbRenderer.height * 0.9, 0.0, 0, 1.0, 1.0);
//	this.player.visible = _separateShadowLayer;
	// this.layer.addChild(this.player);
	this.player.die = false;
	this.playerDirX = -2;

	// player bullets
	imageData = this.parent.loader.getFile( this.parent.bulletImg );
	this.bulletSurface = new pbSurface();
	this.bulletSurface.create(0, 0, 1, 1, imageData);
	this.bulletPool = [];		// pool for bullets which aren't firing
	this.bullets = [];			// list of bullets which are firing
	var i;
	for(i = 0; i < 100; i++)
	{
		var img = new imageClass();
		// anchor point at front of bullet for easy collisions...
		img.create(this.bulletSurface, 0, 0.5, 0.0);
		var bullet = new pbTransformObject();
		bullet.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the layer until it's fired
		this.bulletPool.push(bullet);
	}

	// player rockets
	imageData = this.parent.loader.getFile( this.parent.rocketImg );
	this.rocketSurface = new pbSurface();
	this.rocketSurface.create(32, 32, 8, 1, imageData);
	this.rocketPool = [];		// pool for rockets which aren't firing
	this.rockets = [];			// list of rockets which are firing
	for(i = 0; i < 100; i++)
	{
		var img = new imageClass();
		img.create(this.rocketSurface, 0, 0.5, 0.5);
		var rocket = new pbTransformObject();
		rocket.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the layer until it's fired
		this.rocketPool.push(rocket);
	}

	// aliens
	imageData = this.parent.loader.getFile( this.parent.invaderImg );
	this.invaderSurface = new pbSurface();
	this.invaderSurface.create(32, 32, 4, 1, imageData);
	this.addInvaders();

	// alien bombs
	imageData = this.parent.loader.getFile( this.parent.bombImg );
	this.bombSurface = new pbSurface();
	this.bombSurface.create(0, 0, 1, 1, imageData);
	this.bombPool = [];			// pool for bombs which aren't firing
	this.bombs = [];			// list of bombs which are firing
	for(i = 0; i < 100; i++)
	{
		var img = new imageClass();
		img.create(this.bombSurface, 0);
		var bomb = new pbTransformObject();
		bomb.create(img, 0, 0, 0, 0, 1.0, 1.0);
		// don't add it to the layer until it's fired
		this.bombPool.push(bomb);
	}
	// record the nearest bomb to the player's position (so he can try to dodge)
	this.nearest = null;

	// explosions
	imageData = this.parent.loader.getFile( this.parent.explosionImg );
	this.explosionSurface = new pbSurface();
	this.explosionPool = [];
	this.explosions = [];
	this.explosionSurface.create(128, 128, 16, 1, imageData);
	for(i = 0; i < 100; i++)
	{
		var img = new imageClass();
		img.create(this.explosionSurface, 0);
		var explosion = new pbTransformObject();
		explosion.create(img, 0, 0, 0, 0, 0.5, 0.5);
		this.explosionPool.push(explosion);
	}

	// smoke puffs
	imageData = this.parent.loader.getFile( this.parent.smokeImg );
	this.smokeSurface = new pbSurface();
	this.smokePool = [];
	this.smokes = [];
	this.smokeSurface.create(64, 64, 8, 1, imageData);
	for(i = 0; i < 200; i++)
	{
		var img = new imageClass();
		img.create(this.smokeSurface, 0);
		var smoke = new pbTransformObject();
		smoke.create(img, 0, 0, 0, 0, 1.0, 1.0);
		this.smokePool.push(smoke);
	}

	if (this.useFrame)
	{
		imageData = this.parent.loader.getFile( this.parent.frame_l );
		var surface = new pbSurface();
		surface.create(0, 0, 1, 1, imageData);
		surface.isNPOT = true;
		var img = new imageClass();
		img.create(surface, 0, 0, 0, false, false);
		var sprite = new pbTransformObject();
		sprite.create(img, 0, 0, 0, 0, 1.0, 1.0);
		this.uiLayer.addChild(sprite);

		imageData = this.parent.loader.getFile( this.parent.frame_t );
		surface = new pbSurface();
		surface.create(0, 0, 1, 1, imageData);
		surface.isNPOT = true;
		img = new imageClass();
		img.create(surface, 0, 0, 0, false, false);
		sprite = new pbTransformObject();
		sprite.create(img, 0, 0, 0, 0, 1.0, 1.0);
		this.uiLayer.addChild(sprite);

		imageData = this.parent.loader.getFile( this.parent.frame_r );
		surface = new pbSurface();
		surface.create(0, 0, 1, 1, imageData);
		surface.isNPOT = true;
		img = new imageClass();
		img.create(surface, 0, 1, 0, false, false);
		sprite = new pbTransformObject();
		sprite.create(img, pbRenderer.width, 0, 0, 0, 1.0, 1.0);
		this.uiLayer.addChild(sprite);

		imageData = this.parent.loader.getFile( this.parent.frame_b );
		surface = new pbSurface();
		surface.create(0, 0, 1, 1, imageData);
		surface.isNPOT = true;
		img = new imageClass();
		img.create(surface, 0, 0, 1, false, false);
		sprite = new pbTransformObject();
		sprite.create(img, 0, pbRenderer.height, 0, 0, 1.0, 1.0);
		this.uiLayer.addChild(sprite);
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
			var invader = new pbTransformObject();
			invader.create(img, 20 + x * 48, 80 + y * 48, 0, 0, 1.0, 1.0);
			this.shadowLayer.addChild(invader);
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
	//this.bgSurface.cellTextureBounds[0][0].y -= 1 / pbRenderer.height;


	//
	// update player
	//
	if (this.player.die)
	{
		// TODO: life lost
		this.player.x = pbRenderer.width * 0.5;
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
	if (this.player.x < this.player.surface.cellWide * 0.5
		|| this.player.x > pbRenderer.width - this.player.surface.cellWide * 0.5)
		this.playerDirX = -this.playerDirX;
	// move
	this.player.x += this.playerDirX;
	// fire player bullet
	if (Math.random() < 0.1)
		if (this.bulletPool.length > 0)
			this.playerShoot();
	// fire player rocket
	if (Math.random() < 0.04)
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
				|| invader.x > pbRenderer.width - invader.image.surface.cellWide * 0.5)
				this.flipDir = true;

			// invader dropping bomb
			if (Math.random() < 0.02)
				if (this.bombPool.length > 0)
					this.invaderBomb(invader);
		}

		// vertical movement
		invader.y += this.invaderMoveY;
		if (invader.y > pbRenderer.height + invader.image.surface.cellHigh)
			invader.die = true;

		// animation
		invader.image.cellFrame += 0.2;
		if (invader.image.cellFrame >= 4) invader.image.cellFrame = 0;

		if (invader.die)
		{
			this.shadowLayer.removeChild(invader);
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
			b.angleInRadians = Math.PI + Math.PI / 3;
		}
		else
		{
			b.x = this.player.x + 8;
			b.angleInRadians = Math.PI - Math.PI / 3;
		}
		b.image.cellFrame = 0;
		b.y = this.player.y;
		b.velocity = 5;
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

		// if we have no target or our target is already dead, don't try to home in on it
		if (b.target && !b.target.die)
		{
			var dx = b.target.x - b.x;
			var dy = b.target.y - b.y;
			var desired = Math.atan2(dx, dy);
			if (desired < 0) desired += Math.PI * 2.0;
			if (desired >= Math.PI * 2.0) desired -= Math.PI * 2.0;
			b.angleInRadians = turnToFace(b.angleInRadians, desired, Math.PI * 2.0, 0.03);
		}

		// hit alien or off the edges of the screen?
		if (this.invaderCollide(b.x, b.y, true) || b.y < -b.image.surface.cellHigh || b.x < 0 || b.x > pbRenderer.width)
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
		var w2 = this.player.surface.cellWide * 0.5;
		if (b.x > this.player.x - w2 && b.x < this.player.x + w2)
		{
			var h2 = this.player.surface.cellHigh * 0.5;
			if (b.y > this.player.y - h2 && b.y < this.player.y + h2)
			{
				this.addExplosion(this.player.x, this.player.y);
				this.player.die = true;
				hit = true;
			}
		}

		// track the nearest bomb to the player so the AI can try to dodge them
		// checks if the bomb is above or almost level with the player too (we don't care if it's beneath us already)
		var dx = this.player.x - b.x;
		var dy = this.player.y - b.y;
		var d2 = dx * dx + dy * dy;
		if (d2 < nearDist2 && d2 < 45 * 45 && dy > -4)
		{
			this.nearest = b;
			nearDist2 = d2;
		}

		// hit player or off the bottom of the screen?
		if (hit || b.y > pbRenderer.height + b.image.surface.cellHigh * 0.5)
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
