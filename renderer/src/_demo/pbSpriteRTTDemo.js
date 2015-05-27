/**
 *
 * Demo showing sprites which use render-to-texture as their sources, for the new Phaser 3 renderer.
 *
 * This demo illustrates how to render to a texture then attach that texture to a pbSurface.
 * From there on the rest of creating a pbImage and displaying pbTransformObject transformations of
 * it is exactly the same as the pbTransforms demo... proving that the render-to-texture now fits
 * seamlessly into the rendering engine.
 * 
 */


function pbSpriteRTTDemo( docId )
{
	console.log( "pbSpriteRTTDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "ball", "../img/sphere3.png" );

	console.log( "pbSpriteRTTDemo c'tor exit" );
}


pbSpriteRTTDemo.prototype.allLoaded = function()
{
	console.log( "pbSpriteRTTDemo.allLoaded" );

	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbSpriteRTTDemo.prototype.create = function()
{
	console.log("pbSpriteRTTDemo.create");

	// render the loaded image to a texture and create a pbSurface to hold it
	this.renderToTexture();

	// add some sprites that use the rendered texture for their source
	this.addSprites();
};


pbSpriteRTTDemo.prototype.destroy = function()
{
	console.log("pbSpriteRTTDemo.destroy");

	this.surface.destroy();
	this.surface = null;

	this.rttSurface.destroy();
	this.rttSurface = null;

	this.renderer.destroy();
	this.renderer = null;
};


pbSpriteRTTDemo.prototype.restart = function()
{
	console.log("pbSpriteRTTDemo.restart");
	
	this.destroy();
	this.create();
};


pbSpriteRTTDemo.prototype.renderToTexture = function()
{
	console.log("pbSpriteRTTDemo.renderToTexture");

	// get the loaded image into a surface and create an image to hold it
	var imageData = this.loader.getFile( this.spriteImg );
	this.surface = new pbSurface();
	this.surface.create(0, 0, 1, 1, imageData);
	var img = new imageClass();
	// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
	img.create(this.surface, 0, 0.5, 0.5, false, false);

	// use GPU texture register 0 to hold the source image for this draw
	var srcTextureRegister = 0;
	// use GPU texture register 1 to hold the destination texture for this draw
	this.rttTextureRegister = 1;

	// create the render-to-texture
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureRegister, 64, 64);
	this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
	this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

	// draw the loaded image into the render-to-texture
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.rttRenderbuffer);
	// TODO: setting the viewport to the texture size means everything has to be scaled up to compensate... try to find another way
	gl.viewport(0, 0, this.rttTexture.width, this.rttTexture.height);
	// offset to the middle of the texture and scale it up
	// TODO: despite the viewport scaling, we have to use pbRenderer.width and height for the offset... why??
	var transform = pbMatrix3.makeTransform(pbRenderer.width/2 , pbRenderer.height/2, 0, pbRenderer.width/this.rttTexture.width, pbRenderer.height/this.rttTexture.height);
	this.renderer.graphics.drawImageWithTransform( srcTextureRegister, img, transform, 1.0 );
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// create a surface using the render-to-texture texture as the source
	this.rttSurface = new pbSurface();
	this.rttSurface.create(0, 0, 1, 1, null, this.rttTexture, this.rttTextureRegister);
};


pbSpriteRTTDemo.prototype.addSprites = function()
{
	console.log("pbSpriteRTTDemo.addSprites");

	var img = new imageClass();
	img.create(this.rttSurface, 0, 0.5, 1.0);		// anchorY = 1.0 - make movement appear more complex

	this.dirx = 2;
	this.spr = new pbTransformObject();
	this.spr.create(img, 200, 200, 1.0, 0, 1.0, 1.0);
	rootLayer.addChild(this.spr);

	this.child = new pbTransformObject();
	this.child.create(img, 0, -75, 1.0, 0, 0.75, 0.75);
	this.spr.addChild(this.child);

	this.childchild = new pbTransformObject();
	this.childchild.create(img, 0, -75, 1.0, 0, 0.75, 0.75);
	this.child.addChild(this.childchild);

	var childchildchild = new pbTransformObject();
	childchildchild.create(img, 0, -50, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);

	childchildchild = new pbTransformObject();
	childchildchild.create(img, 0, 50, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);

	childchildchild = new pbTransformObject();
	childchildchild.create(img, -50, 0, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);

	childchildchild = new pbTransformObject();
	childchildchild.create(img, 50, 0, 1.0, 0, 0.5, 0.5);
	this.childchild.addChild(childchildchild);
};


pbSpriteRTTDemo.prototype.update = function()
{
	// make the first three depths rotate at different speeds
	this.childchild.angleInRadians += 0.04;
	this.child.angleInRadians += 0.02;
	this.spr.angleInRadians += 0.01;

	// bounce the top sprite across the renderer view
	this.spr.x += this.dirx;
	if (this.spr.x < 150) this.dirx = -this.dirx;
	if (this.spr.x > pbRenderer.width - 150) this.dirx = -this.dirx;
};

