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
	this.files = [];

	this.callback = callback;
	this.context = context;

	console.log("pbLoader c'tor exit");
}


pbLoader.prototype.loadFile = function(filename)
{
	console.log("pbLoader.loadFile ", filename);

	var index = this.files.length;
	var _this = this;
	
	this.files[index] = new XMLHttpRequest();
	this.files[index].open("GET", filename, true);
	this.files[index].responseType = 'text';
	this.files[index].onload = function(evt) {
		_this.loaded.call(_this, evt, index);
	};

	this.queue.push(this.files[index]);
	this.files[index].send();

	return index;
};


pbLoader.prototype.loadImage = function(filename)
{
	console.log("pbLoader.loadImage ", filename);

	var index = this.files.length;
	var _this = this;
	
	this.files[index] = new Image();
	this.files[index].onload = this.makeLoadHandler(_this, index);	//function(evt) { _this.loaded.call(_this, evt, index); };
	this.files[index].src = filename;
	this.queue.push(this.files[index]);

	return index;
};


/**
 * [loadImages description]
 *
 * @param  {[type]} filenames - list of filename strings
 *
 * @return {[type]} list of file indices as used for pbLoader.getFile() calls
 */
pbLoader.prototype.loadImages = function(filenames)
{
	console.log("pbLoader.loadImages ", filenames);

	var indices = [];

	for(var filename in filenames)
	{
		if (filenames.hasOwnProperty(filename))
		{
			var index = this.files.length;
			var _this = this;
			
			this.files[index] = new Image();
			this.files[index].onload = this.makeLoadHandler(_this, index);	//function(evt) { _this.loaded.call(_this, evt, index); };
			this.files[index].src = filename;
			this.queue.push(this.files[index]);

			indices.push(index);
		}
	}

	return indices;
};


pbLoader.prototype.makeLoadHandler = function(context, index)
{
	return function(evt) {
		context.loaded.call(context, evt, index);
	};
};


pbLoader.prototype.loaded = function(evt)
{
	console.log("pbLoader.loaded");

	var i = this.queue.indexOf(evt.target);
	if (i != -1)
	{
		this.queue.splice(i, 1);
	}

	// loaded all files so the queue is now empty?
	if (this.queue.length === 0)
		this.callback.call(this.context);
};


pbLoader.prototype.getFile = function(_index)
{
	return this.files[_index];
};


