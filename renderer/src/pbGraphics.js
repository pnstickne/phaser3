/**
 *
 * pbGraphics - a drawing API to wrap the canvas, webGL, and anything else we end up with
 * 
 */



function pbGraphics()
{
	this.fillColorString = "#000";			// fill color as a css format color string, # prefixed, rgb(), rgba() or hsl()
	this.fillColorValue = 0;				// fill color as a Number
	this.fillColorRGBA = { r: 0, g: 0, b: 0, a: 0 };
	this.lineColorString = "#000";			// line color as a css format color string, # prefixed, rgb(), rgba() or hsl()
	this.lineColorValue = 0;				// line color as a Number
	this.lineColorRGBA = { r: 0, g: 0, b: 0, a: 0 };
}


pbGraphics.prototype.destroy = function()
{
	this.reset();
};


pbGraphics.prototype.fillStyle = function(color)
{
	if (typeof color === "number")
	{
		this.fillColorValue = color;
		this.fillColorString = this.colorNumberToString(color);
		this.fillColorRGBA = this.colorStringToRGBA(this.fillColorString);
	}
	else if (typeof color === "string")
	{
		this.fillColorString = color;
		this.fillColorValue = this.colorStringToNumber(color);
		this.fillColorRGBA = this.colorStringToRGBA(this.fillColorString);
	}
};


pbGraphics.prototype.fillRect = function(param0, y, width, height)
{
	var x;

	if (param0.constructor === pbRectangle)
	{
		x = param0.x;
		y = param0.y;
		width = param0.width;
		height = param0.height;
	}
	else if (typeof param0 === "number")
	{
		x = param0;
	}
	else
	{
		// unknown format for param0
		return;
	}

	switch(renderer)
	{
		case "canvas":
			ctx.fillRect(x, y, width, height);
			break;
		case "webgl":
			webGl.fillRect(x, y, width, height, this.fillColorRGBA, this.lineColorValue);
			break;
	}
};


pbGraphics.prototype.drawImage = function(x, y, z, _surface, cell, angle, scale)
{
	switch(renderer)
	{
		case "canvas":
			break;
		case "webgl":
			webGl.drawImage(x, y, z, _surface, cell, angle, scale);
			break;
	}
};


pbGraphics.prototype.drawImageWithTransform = function(_transform, _z_order, _surface, _cellFrame)
{
	switch(renderer)
	{
		case "canvas":
			break;
		case "webgl":
			webGl.drawImageWithTransform(_transform, _z_order, _surface, _cellFrame);
			break;
	}
};


pbGraphics.prototype.batchDrawImages = function(list, _surface)
{
	switch(renderer)
	{
		case "canvas":
			break;
		case "webgl":
			webGl.batchDrawImages(list, _surface);
			break;
	}
};


pbGraphics.prototype.colorNumberToString = function(colorValue)
{
	return '#' + ('00000' + (colorValue | 0).toString(16)).substr(-6);
};


pbGraphics.prototype.colorStringToNumber = function(colorString)
{
	return window.parseInt(colorString.slice(1), 16);
};


pbGraphics.prototype.colorStringToRGBA = function(hex)
{
	if (hex.charAt(0) === '#') hex = hex.slice(1);
	if (hex.length === 3)	// shorthand form (#F26)
		return {
	        r: parseInt(hex.charAt(0)+hex.charAt(0), 16) / 255,
	        g: parseInt(hex.charAt(1)+hex.charAt(1), 16) / 255,
	        b: parseInt(hex.charAt(2)+hex.charAt(2), 16) / 255,
	        a: 1.0
    	};
	else if (hex.length === 6)	// no alpha form (#FE246A)
		return {
	        r: parseInt(hex.slice(0,2), 16) / 255,
	        g: parseInt(hex.slice(2,4), 16) / 255,
	        b: parseInt(hex.slice(4,6), 16) / 255,
	        a: 1.0
    	};		
	else
		return {
	        r: parseInt(hex.slice(0,2), 16) / 255,
	        g: parseInt(hex.slice(2,4), 16) / 255,
	        b: parseInt(hex.slice(4,6), 16) / 255,
	        a: parseInt(hex.slice(6,8), 16) / 255
    	};
};


pbGraphics.prototype.reset = function()
{
	switch(renderer)
	{
		case "canvas":
			break;
		case "webgl":
			webGl.reset();
			break;
	}
};

