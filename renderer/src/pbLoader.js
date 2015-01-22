/**
 *
 * Resource loader.
 *
 * Pete Baron 8/12/2014
 * 
 */


function pbLoader(callback, context)
{
	console.log("pbLoader c'tor entry");

	this.queue = [];
	this.images = [];

	this.callback = callback;
	this.context = context;

	console.log("pbLoader c'tor exit");
}



pbLoader.prototype.loadImage = function(filename)
{
	console.log("pbLoader.loadImage ", filename);

	var index = this.images.length;
	var _this = this;
	
	this.images[index] = new Image();
	this.images[index].onload = function(evt) { _this.loaded.call(_this, evt); };
	this.images[index].src = filename;
	this.queue.push(this.images[index]);

	return index;
};


pbLoader.prototype.loaded = function(evt)
{
	console.log("pbLoader.loaded");

	var i = this.queue.indexOf(evt.target);
	if (i != -1)
		this.queue.splice(i, 1);

	// loaded all images so the queue is now empty?
	if (this.queue.length === 0)
		this.callback.call(this.context);
};


pbLoader.prototype.getImage = function(imgIndex)
{
	return this.images[imgIndex];
};


