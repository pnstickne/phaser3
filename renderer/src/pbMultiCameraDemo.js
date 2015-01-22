/**
 *
 * pbMultiCameraDemo.js - example to illustrate the use of multiple cameras simultaneously
 * 
 */


function pbMultiCameraDemo( docId )
{
	console.log( "pbAutoInvaderDemo c'tor entry" );

	var _this = this;
	this.docId = docId;
	
	this.renderer = new pbRenderer( this.docId, this.create, this.update, this );
}


pbMultiCameraDemo.prototype.create = function()
{
	this.cameras = [];
	for(var i = 0; i < 4; i++)
	{
		var layer = new pbLayer();
		layer.create(rootLayer, 0, 0, 0, 0, 0.5, 0.5);
		this.cameras[i] = new pbAutoInvaderDemo();
		this.cameras[i].create(layer);
	}
};


pbMultiCameraDemo.prototype.destroy = function()
{
	for(var i = 0, l = this.cameras.length; i < l; i++)
		this.cameras[i].destroy();
	this.cameras = null;
};


pbMultiCameraDemo.prototype.update = function()
{
	for(var i = 0, l = this.cameras.length; i < l; i++)
	{
		this.cameras[i].update();
	}
};


