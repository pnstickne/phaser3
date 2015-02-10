/**
 *
 * WebGL support code
 *
 */



var MAX_SPRITES = 300000;

var gl = null;


function pbWebGl()
{
	console.log( "pbWebGl c'tor" );
	gl = null;
	this.shaders = null;
	this.bgVertexBuffer = null;
	this.bgColorBuffer = null;
	this.positionBuffer = null;
	this.onGPU = [];
	this.canReadTexture = false;
	this.fb = null;
	this.currentTexture = null;
	// pre-allocate the this.drawingArray to avoid memory errors from fragmentation (seen on Chrome (debug Version 39.0.2171.71 m) after running 75000 sprite demo for ~15 seconds)
	this.drawingArray = new Float32Array( MAX_SPRITES * (44 + 22) - 22 );
}


// pbWebGl extends from the pbBaseGraphics prototype chain
pbWebGl.prototype = new pbBaseGraphics();
// create property to store the class' parent
pbWebGl.prototype.__super__ = pbBaseGraphics;		// http://stackoverflow.com/questions/7300552/calling-overridden-methods-in-javascript


pbWebGl.prototype.create = function( _canvas )
{
	// https://www.khronos.org/webgl/wiki/FAQ
	if ( window.WebGLRenderingContext )
	{
		console.log( "pbWebGl.initGl" );
		try
		{
			//gl = canvas.getContext( "webgl" );
			gl = _canvas.getContext( "webgl", { alpha: false } );
			if (!gl)	// support IE11, lagging behind as usual
				gl = _canvas.getContext( "experimental-webgl", { alpha: false } );
		}
		catch ( e )
		{
			alert( "WebGL initialisation error: ", e.message );
			return false;
		}

		// if this version of webGl can't use textures, it's useless to us
		var numTexturesAvailableInVertexShader = gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS );
		if ( numTexturesAvailableInVertexShader === 0 )
		{
			gl = null;
			return false;
		}

		// create the shader handler
		this.shaders = new pbShaders();
		this.shaders.create();

		// enable the depth buffer so we can order our sprites
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		// set blending mode
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.enable( gl.BLEND );

		// set the parameters to clear the render area
		gl.clearColor( 0.1, 0.2, 0.1, 1.0 );
		gl.clearDepth( 1.0 );

		// precalculate the drawing buffer's half-width and height values
		this.screenWide2 = gl.drawingBufferWidth * 0.5;
		this.screenHigh2 = gl.drawingBufferHeight * 0.5;
		// calculate inverse to avoid division in loop
		this.iWide = 1.0 / this.screenWide2;
		this.iHigh = 1.0 / this.screenHigh2;

		return true;
	}
	return false;
};


pbWebGl.prototype.destroy = function()
{
	if (this.shaders)
		this.shaders.destroy();
	this.shaders = null;
	this.bgVertexBuffer = null;
	this.bgColorBuffer = null;
	this.currentTexture = null;
	this.positionBuffer = null;
	this.onGPU = null;
	this.fb = null;
	this.drawingArray = null;
	gl = null;
};


pbWebGl.prototype.preRender = function()
{
	// clear the viewport
	gl.disable( gl.SCISSOR_TEST );
	gl.viewport( 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
};


pbWebGl.prototype.fillStyle = function(_fillColor, _lineColor)
{
	this.fillColorRGBA = _fillColor;
	this.lineColorValue = _lineColor;
	this.fillColorString = "#000";			// fill color as a css format color string, # prefixed, rgb(), rgba() or hsl()
	this.fillColorValue = 0;				// fill color as a Number
	this.fillColorRGBA = { r: 0, g: 0, b: 0, a: 0 };
	this.lineColorString = "#000";			// line color as a css format color string, # prefixed, rgb(), rgba() or hsl()
	this.lineColorValue = 0;				// line color as a Number
	this.lineColorRGBA = { r: 0, g: 0, b: 0, a: 0 };
};


pbWebGl.prototype.fillRect = function( x, y, wide, high, color )
{
	// console.log( "pbWebGl.fillRect" );

	this.shaders.setProgram(this.shaders.graphicsShaderProgram);

	var x2 = x + wide;
	var y2 = y + high;
	var vertices =
	[
         x, y,
         x2, y,
         x, y2,
         x2, y2
    ];

	this.bgVertexBuffer = gl.createBuffer();
	this.bgVertexBuffer.numPoints = 4;
	gl.bindBuffer( gl.ARRAY_BUFFER, this.bgVertexBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

	var colors =
	[
		color.r, color.g, color.b, color.a,
		color.r, color.g, color.b, color.a,
		color.r, color.g, color.b, color.a,
		color.r, color.g, color.b, color.a
	];

	this.bgColorBuffer = gl.createBuffer();
	this.bgColorBuffer.numPoints = 4;
	gl.bindBuffer( gl.ARRAY_BUFFER, this.bgColorBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( colors ), gl.STATIC_DRAW );

	gl.bindBuffer( gl.ARRAY_BUFFER, this.bgVertexBuffer );
	gl.vertexAttribPointer( this.shaders.currentProgram.aPosition, 2, gl.FLOAT, gl.FALSE, 0, 0 );

	gl.bindBuffer( gl.ARRAY_BUFFER, this.bgColorBuffer );
	gl.vertexAttribPointer( this.shaders.currentProgram.color, 4, gl.FLOAT, gl.FALSE, 0, 0 );

	gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.bgVertexBuffer.numPoints );
};


pbWebGl.prototype.handleTexture = function( _image, _tiling, _npot )
{
	// this _image is already the selected texture
	if (this.currentTexture && this.currentTexture.image === _image)
		return;

	var texture = null;

	var index = this.onGPU.indexOf(_image);
    if (index != -1)
    {
		// the _image is already on the GPU
		texture = this.onGPU[index].gpuTexture;
		// bind it to use it...
	    gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    else
    {
    	// upload it to the GPU
	    var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	    if (_image.width > maxSize || _image.height > maxSize)
	    {
		    alert("ERROR: Texture size not supported by this video card!", _image.width, _image.height, " > ", maxSize);
		    return;
	    }

		console.log( "pbWebGl.handleTexture uploading new texture : ", _image.width, "x", _image.height );

	    // link the texture object to the image and vice-versa
		texture = gl.createTexture();
		texture.image = _image;
		_image.gpuTexture = texture;

	    gl.bindTexture(gl.TEXTURE_2D, texture);
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _image);
	    if (_npot)
	    {
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	    }
	    else if (_tiling)
	    {
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		    gl.generateMipmap(gl.TEXTURE_2D);
	    }
    	else
    	{
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		    gl.generateMipmap(gl.TEXTURE_2D);
    	}

	    // remember that this texture has been uploaded
	    this.onGPU.push(_image);
	}

	// activate the texture
    this.currentTexture = texture;
    gl.activeTexture( gl.TEXTURE0 );

   	// TODO: the rest of this stuff doesn't belong in this function...
   	gl.uniform1i( this.shaders.currentProgram.samplerUniform, 0 );

	// create a buffer to transfer all the vertex position data through
	this.positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );

	// set up the projection matrix in the vertex shader
	gl.uniformMatrix3fv( this.shaders.currentProgram.uProjectionMatrix, false, pbMatrix3.makeProjection(gl.drawingBufferWidth, gl.drawingBufferHeight) );
};


pbWebGl.prototype.drawImageWithTransform = function( _image, _transform, _z )
{
	this.shaders.setProgram(this.shaders.imageShaderProgram);

	var surface = _image.surface;
	this.handleTexture( surface.image, _image.tiling, surface.isNPOT );

	// split off a small part of the big buffer, for a single display object
	var sa = this.drawingArray.subarray(0, 16);

	// set up the animation frame
	var cell = Math.floor(_image.cellFrame);
	var rect = surface.cellTextureBounds[cell % surface.cellsWide][Math.floor(cell / surface.cellsWide)];

	var wide, high;
	if (_image.fullScreen)
	{
		rect.width = gl.drawingBufferWidth / surface.cellWide;
		rect.height = gl.drawingBufferHeight / surface.cellHigh;
		wide = gl.drawingBufferWidth;
		high = gl.drawingBufferHeight;
	}
	else
	{
		// half width, half height (of source frame)
		wide = surface.cellWide;
		high = surface.cellHigh;
	}

	// screen destination position
	// l, b,		0,1
	// l, t,		4,5
	// r, b,		8,9
	// r, t,		12,13
	if (_image.corners)
	{
		var cnr = _image.corners;
		l = -wide * _image.anchorX;
		r = wide + l;
		t = -high * _image.anchorY;
		b = high + t;
		// object has corner offets (skewing/perspective etc)
		sa[ 0 ] = cnr.lbx * l; sa[ 1 ] = cnr.lby * b;
		sa[ 4 ] = cnr.ltx * l; sa[ 5 ] = cnr.lty * t;
		sa[ 8 ] = cnr.rbx * r; sa[ 9 ] = cnr.rby * b;
		sa[ 12] = cnr.rtx * r; sa[ 13] = cnr.rty * t;
	}
	else
	{
		l = -wide * _image.anchorX;
		r = wide + l;
		t = -high * _image.anchorY;
		b = high + t;
		sa[ 0 ] = sa[ 4 ] = l;
		sa[ 1 ] = sa[ 9 ] = b;
		sa[ 8 ] = sa[ 12] = r;
		sa[ 5 ] = sa[ 13] = t;
	}

	// texture source position
	// x, b,		2,3
	// x, y,		6,7
	// r, b,		10,11
	// r, y,		14,15
	sa[ 2 ] = sa[ 6 ] = rect.x;
	sa[ 3 ] = sa[ 11] = rect.y + rect.height;
	sa[ 10] = sa[ 14] = rect.x + rect.width;
	sa[ 7 ] = sa[ 15] = rect.y;

    gl.bufferData( gl.ARRAY_BUFFER, sa, gl.STATIC_DRAW );

	// send the transform matrix to the vector shader
	gl.uniformMatrix3fv( this.shaders.currentProgram.matrixUniform, false, _transform );

	// set the depth value
   	gl.uniform1f( this.shaders.currentProgram.uZ, _z );

	// point the position attribute at the last bound buffer
    gl.vertexAttribPointer( this.shaders.currentProgram.aPosition, 4, gl.FLOAT, false, 0, 0 );

    // four vertices per quad, one quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};


pbWebGl.prototype.drawImage = function( _x, _y, _z, _surface, _cellFrame, _angle, _scale )
{
	this.shaders.setProgram(this.shaders.imageShaderProgram);

	this.handleTexture( _surface.image, null, _surface.isNPOT );

	// split off a small part of the big buffer, for a single display object
	var sa = this.drawingArray.subarray(0, 20);

	// half width, half height (of source frame)
	var wide = _surface.cellWide * 0.5;
	var high = _surface.cellHigh * 0.5;

	// set up the animation frame
	var cell = Math.floor(_cellFrame);
	var cx = cell % _surface.cellsWide;
	var cy = Math.floor(cell / _surface.cellsWide);
	var rect = _surface.cellTextureBounds[cx][cy];
	var tex_x = rect.x;
	var tex_y = rect.y;
	var tex_r = rect.x + rect.width;
	var tex_b = rect.y + rect.height;

	// screen destination position
	// l, b,		0,1
	// l, t,		4,5
	// r, b,		8,9
	// r, t,		12,13
	sa[ 0 ] = sa[ 4 ] = -wide;
	sa[ 1 ] = sa[ 9 ] =  high;
	sa[ 8 ] = sa[ 12] =  wide;
	sa[ 5 ] = sa[ 13] = -high;

	// texture source position
	// 0, 0,		2,3
	// 0, 1,		6,7
	// 1, 0,		10,11
	// 1, 1,		14,15
	sa[ 2 ] = sa[ 6 ] = tex_x;
	sa[ 3 ] = sa[ 11] = tex_b;
	sa[ 10] = sa[ 14] = tex_r;
	sa[ 7 ] = sa[ 15] = tex_y;

    gl.bufferData( gl.ARRAY_BUFFER, sa, gl.STATIC_DRAW );

	// TODO: most of these are semi-static, cache them
	var matrix = pbMatrix3.makeTransform(_x, _y, _angle, _scale, _scale);

	// var translationMatrix = pbMatrix3.makeTranslation(_x, _y);
	// var rotationMatrix = pbMatrix3.makeRotation(_angle);
	// var scaleMatrix = pbMatrix3.makeScale(_scale, _scale);

	// var matrix = pbMatrix3.fastMultiply(rotationMatrix, scaleMatrix);
	// matrix = pbMatrix3.fastMultiply(matrix, translationMatrix);

	// send the matrix to the vector shader
	gl.uniformMatrix3fv( this.shaders.currentProgram.matrixUniform, false, matrix );

	// set the depth value
   	gl.uniform1f( this.shaders.currentProgram.uZ, _z );

	// point the position attribute at the last bound buffer
    gl.vertexAttribPointer( this.shaders.currentProgram.aPosition, 4, gl.FLOAT, false, 0, 0 );

    // four vertices per quad, one quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};


// TODO: test variation of blitSimpleDrawImages that uses non-indexed triangle list instead of tri-strips... overhead of degenerate triangles might be greater than the extra vertex data, especially as the JS will become shorter/simpler too!

pbWebGl.prototype.blitSimpleDrawImages = function( _list, _listLength, _surface )
{
	this.shaders.setProgram(this.shaders.blitShaderProgram);

	this.handleTexture( _surface.image, null, _surface.isNPOT );

	var screenWide2 = gl.drawingBufferWidth * 0.5;
	var screenHigh2 = gl.drawingBufferHeight * 0.5;

	// calculate inverse to avoid division in loop
	var iWide = 1.0 / screenWide2;
	var iHigh = 1.0 / screenHigh2;

	// TODO: generate warning if length is capped
	var len = Math.min(_listLength, MAX_SPRITES);

	var scale = 1.0;
	var wide = _surface.cellWide * scale * 0.5 / screenWide2;
	var high = _surface.cellHigh * scale * 0.5 / screenHigh2;

	var old_t;
	var old_r;

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
    var buffer = this.drawingArray.subarray(0, len * 24 - 8);

	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
	for ( var i = -1, c = 0; ++i < len; c += 16 )
	{
		var x = _list[i].x * iWide - 1;
		var y = 1 - _list[i].y * iHigh;
		var l = x - wide;
		var b = y + high;

		if ( i > 0 )
		{
			// degenerate triangle: repeat the last vertex
			buffer[ c     ] = old_r;
			buffer[ c + 1 ] = old_t;
		 	// repeat the next vertex
			buffer[ c + 4 ] = l;
		 	buffer[ c + 5 ] = b;
		 	// texture coordinates are unused
			//buffer[ c + 2 ] = buffer[ c + 3 ] = buffer[ c + 6 ] = buffer[ c + 7 ] = 0;
			c += 8;
		}

		// screen destination position
		// l, b,		0,1
		// l, t,		4,5
		// r, b,		8,9
		// r, t,		12,13

		buffer[ c     ] = buffer[ c + 4 ] = l;
		buffer[ c + 1 ] = buffer[ c + 9 ] = b;
		buffer[ c + 8 ] = buffer[ c + 12] = old_r = x + wide;
		buffer[ c + 5 ] = buffer[ c + 13] = old_t = y - high;

		// texture source position
		// 0, 0,		2,3
		// 0, 1,		6,7
		// 1, 0,		10,11
		// 1, 1,		14,15
		buffer[ c + 2 ] = buffer[ c + 6] = buffer[ c + 3 ] = buffer[ c + 11] = 0;
		buffer[ c + 10] = buffer[ c + 14] = buffer[ c + 7 ] = buffer[ c + 15] = 1;
	}


    gl.bufferData( gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW );
    gl.vertexAttribPointer( this.shaders.currentProgram.aPosition, 4, gl.FLOAT, false, 0, 0 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, len * 6 - 2);		// four vertices per sprite plus two degenerate points
};


pbWebGl.prototype.blitDrawImages = function( _list, _surface )
{
	this.shaders.setProgram(this.shaders.blitShaderProgram);

	this.handleTexture( _surface.image, null, _surface.isNPOT );

	var screenWide2 = gl.drawingBufferWidth * 0.5;
	var screenHigh2 = gl.drawingBufferHeight * 0.5;

	// calculate inverse to avoid division in loop
	var iWide = 1.0 / screenWide2;
	var iHigh = 1.0 / screenHigh2;

	// TODO: generate warning if length is capped
	var len = Math.min(_list.length, MAX_SPRITES);

	var scale = 1.0;
	var wide = _surface.cellWide * scale * 0.5 / screenWide2;
	var high = _surface.cellHigh * scale * 0.5 / screenHigh2;

	var old_t;
	var old_r;

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
    var buffer = this.drawingArray.subarray(0, len * 24 - 8);

	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
	for ( var i = -1, c = 0; ++i < len; c += 16 )
	{
		var t = _list[ i ].transform;
		var x = t[6] * iWide - 1;
		var y = 1 - t[7] * iHigh;
		var l = x - wide;
		var b = y + high;

		if ( i > 0 )
		{
			// degenerate triangle: repeat the last vertex
			buffer[ c     ] = old_r;
			buffer[ c + 1 ] = old_t;
		 	// repeat the next vertex
			buffer[ c + 4 ] = l;
		 	buffer[ c + 5 ] = b;
		 	// texture coordinates are unused
			//buffer[ c + 2 ] = buffer[ c + 3 ] = buffer[ c + 6 ] = buffer[ c + 7 ] = 0;
			c += 8;
		}

		// screen destination position
		// l, b,		0,1
		// l, t,		4,5
		// r, b,		8,9
		// r, t,		12,13

		buffer[ c     ] = buffer[ c + 4 ] = l;
		buffer[ c + 1 ] = buffer[ c + 9 ] = b;
		buffer[ c + 8 ] = buffer[ c + 12] = old_r = x + wide;
		buffer[ c + 5 ] = buffer[ c + 13] = old_t = y - high;

		// texture source position
		// 0, 0,		2,3
		// 0, 1,		6,7
		// 1, 0,		10,11
		// 1, 1,		14,15
		buffer[ c + 2 ] = buffer[ c + 6] = buffer[ c + 3 ] = buffer[ c + 11] = 0;
		buffer[ c + 10] = buffer[ c + 14] = buffer[ c + 7 ] = buffer[ c + 15] = 1;
	}


    gl.bufferData( gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW );
    gl.vertexAttribPointer( this.shaders.currentProgram.aPosition, 4, gl.FLOAT, false, 0, 0 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, len * 6 - 2);		// four vertices per sprite plus two degenerate points
};


pbWebGl.prototype.batchDrawImages = function( _list, _surface )
{
	this.shaders.setProgram(this.shaders.batchImageShaderProgram);

	this.handleTexture( _surface.image, null, _surface.isNPOT );

	// half width, half height (of source frame)
	var wide = _surface.cellWide * 0.5;
	var high = _surface.cellHigh * 0.5;

	// TODO: generate warning if length is capped
	var len = Math.min(_list.length, MAX_SPRITES);

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
    var sa = this.drawingArray.subarray(0, len * (44 + 22) - 22);

	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig (chrome)!
	for ( var i = -1, c = 0; ++i < len; c += 44 )
	{
		// set up texture reference coordinates based on the image frame number
		var img = _list[i].image;
		var cell = Math.floor(img.cellFrame);
		var surface = img.surface;
		var cx = cell % surface.cellsWide;
		var cy = Math.floor(cell / surface.cellsWide);
		var rect = surface.cellTextureBounds[cx][cy];
		var tex_x = rect.x;
		var tex_y = rect.y;
		var tex_r = rect.x + rect.width;
		var tex_b = rect.y + rect.height;

		var cos = -Math.cos(_list[i].angle);
		var sin = Math.sin(_list[i].angle);
		var scale = _list[i].scale;
		var x = Math.round(_list[i].x);
		var y = Math.round(_list[i].y);
		var z = _list[i].z;

		if ( i > 0)
		{
			// degenerate triangle: repeat the last vertex and the next vertex
			// 
			// screen destination position
			sa[ c     ] = sa[ c - 44 + 33 ];
			sa[ c + 1 ] = sa[ c - 44 + 34 ];
			sa[ c + 11] = -wide;
			sa[ c + 12] =  high;

			// rotation cos & sin components
			sa[ c + 2 ] = sa[c - 44 + 35];
			sa[ c + 3 ] = sa[c - 44 + 36];
			sa[ c + 15] = tex_x;
			sa[ c + 16] = tex_y;

			// rotation cos & sin components
			sa[ c + 4 ] = sa[c - 44 + 37];
			sa[ c + 5 ] = sa[c - 44 + 38];
			sa[ c + 15] = cos;
			sa[ c + 16] = sin;

			// scaling sx & sy components
			sa[ c + 6 ] = sa[ c - 44 + 39];
			sa[ c + 7 ] = sa[ c - 44 + 40];
			sa[ c + 17] = scale;
			sa[ c + 18] = scale;

			// world translation
			sa[ c + 8 ] = sa[c - 44 + 41];
			sa[ c + 9 ] = sa[c - 44 + 42];
			sa[ c + 10] = sa[c - 44 + 43];
			sa[ c + 19] = x;
			sa[ c + 20] = y;
			sa[ c + 21] = z;

			c += 22;
		}

		// screen destination position
		// l, b,		0,1
		// l, t,		11,12
		// r, b,		22,23
		// r, t,		33,34
		sa[ c     ] = sa[ c + 11] = -wide;		// l
		sa[ c + 1 ] = sa[ c + 23] =  high;		// b
		sa[ c + 22] = sa[ c + 33] =  wide;		// r
		sa[ c + 12] = sa[ c + 34] = -high;		// t

		// texture source position
		// l, b,		2,3
		// l, t,		13,14
		// r, b,		24,25
		// r, t,		35,36
		sa[ c + 2 ] = sa[ c + 13] = tex_x;		// l
		sa[ c + 3 ] = sa[ c + 25] = tex_y;		// b
		sa[ c + 24] = sa[ c + 35] = tex_r;		// r
		sa[ c + 14] = sa[ c + 36] = tex_b;		// t

		// rotation cos & sin components
		//  4, 5
		// 15,16
		// 26,27
		// 37,38
		sa[ c + 4 ] = sa[ c + 15] = sa[ c + 26] = sa[ c + 37] = cos;
		sa[ c + 5 ] = sa[ c + 16] = sa[ c + 27] = sa[ c + 38] = sin;

		// scaling sx & sy components
		//  6, 7
		// 17,18
		// 28,29
		// 39,40
		sa[ c + 6 ] = sa[ c + 17] = sa[ c + 28] = sa[ c + 39] = scale;
		sa[ c + 7 ] = sa[ c + 18] = sa[ c + 29] = sa[ c + 40] = scale;

		// world translation
		sa[ c + 8 ] = sa[ c + 19] = sa[ c + 30] = sa[ c + 41] = x;
		sa[ c + 9 ] = sa[ c + 20] = sa[ c + 31] = sa[ c + 42] = y;

		// world depth (0 = front, 1 = back)
		sa[ c + 10] = sa[ c + 21] = sa[ c + 32] = sa[ c + 43] = z;
	}

	// point the attributes at the buffer (stride and offset are in bytes, there are 4 bytes per gl.FLOAT)
    gl.bufferData( gl.ARRAY_BUFFER, sa, gl.STATIC_DRAW );
	gl.vertexAttribPointer( this.shaders.currentProgram.aPosition , 4, gl.FLOAT, false, 11 * 4, 0 * 4 );
	gl.vertexAttribPointer( this.shaders.currentProgram.aTransform, 4, gl.FLOAT, false, 11 * 4, 4 * 4 );
	gl.vertexAttribPointer( this.shaders.currentProgram.aTranslate, 3, gl.FLOAT, false, 11 * 4, 8 * 4 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, len * 6 - 2);		// four vertices per sprite plus two degenerate points
};


// list objects: { image: pbImage, transform: pbMatrix3, z_order: Number }
pbWebGl.prototype.rawBatchDrawImages = function( _list )
{
	var surface = _list[0].image.surface;

	this.shaders.setProgram(this.shaders.rawBatchImageShaderProgram);

	this.handleTexture( surface.image, _list[0].image.tiling, surface.isNPOT );

	// half width, half height (of source frame)
	var wide = surface.cellWide;
	var high = surface.cellHigh;

	// TODO: generate warning if length is capped
	var len = Math.min(_list.length, MAX_SPRITES);

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
    var sa = this.drawingArray.subarray(0, len * (44 + 22) - 22);

    var l, r, t, b;

	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
	for ( var i = -1, c = 0; ++i < len; c += 44 )
	{
		var obj = _list[i];
		var img = obj.image;

		// set up texture reference coordinates based on the image frame number
		var cell = Math.floor(img.cellFrame);
		var cx = cell % surface.cellsWide;
		var cy = Math.floor(cell / surface.cellsWide);
		var rect = surface.cellTextureBounds[cx][cy];
		if (!rect)
			console.log("ERROR: invalid cellFrame", cx, cy);
		var tex_x = rect.x;
		var tex_y = rect.y;
		var tex_r = rect.x + rect.width;
		var tex_b = rect.y + rect.height;

		if ( i > 0)
		{
			// degenerate triangle: repeat the last vertex and the next vertex
			// 
			// screen destination position
			sa[ c     ] = sa[ c - 44 + 33 ];
			sa[ c + 1 ] = sa[ c - 44 + 34 ];

			// last transform matrix
			sa[ c + 4 ] = sa[ c + 4  - 44 ];
			sa[ c + 5 ] = sa[ c + 5  - 44 ];
			sa[ c + 6 ] = sa[ c + 6  - 44 ];
			sa[ c + 7 ] = sa[ c + 7  - 44 ];
			sa[ c + 8 ] = sa[ c + 8  - 44 ];
			sa[ c + 9 ] = sa[ c + 9  - 44 ];
			sa[ c + 10] = sa[ c + 10 - 44 ];

			c += 22;
		}

		// screen destination position
		// l, b,		0,1
		// l, t,		11,12
		// r, b,		22,23
		// r, t,		33,34
		if (img.corners)
		{
			var cnr = img.corners;
			l = -wide * img.anchorX;
			r = wide + l;
			t = -high * img.anchorY;
			b = high + t;
			// object has corner offets (skewing/perspective etc)
			sa[ c     ] = cnr.lbx * l; sa[ c + 1 ] = cnr.lby * b;
			sa[ c + 11] = cnr.ltx * l; sa[ c + 12] = cnr.lty * t;
			sa[ c + 22] = cnr.rbx * r; sa[ c + 23] = cnr.rby * b;
			sa[ c + 33] = cnr.rtx * r; sa[ c + 34] = cnr.rty * t;
		}
		else
		{
			l = -wide * img.anchorX;
			r = wide + l;
			t = -high * img.anchorY;
			b = high + t;
			sa[ c     ] = l; sa[ c + 1 ] = b;
			sa[ c + 11] = l; sa[ c + 12] = t;
			sa[ c + 22] = r; sa[ c + 23] = b;
			sa[ c + 33] = r; sa[ c + 34] = t;
		}

		// texture source position
		// l, b,		2,3
		// l, t,		13,14
		// r, b,		24,25
		// r, t,		35,36
		sa[ c + 2 ] = sa[ c + 13] = tex_x;		// l
		sa[ c + 3 ] = sa[ c + 25] = tex_b;		// b
		sa[ c + 24] = sa[ c + 35] = tex_r;		// r
		sa[ c + 14] = sa[ c + 36] = tex_y;		// t


		if ( i > 0 )
		{
			// next transform matrix for degenerate triangle preceding this entry

			// destination corner (left, bottom)
			sa[ c - 22 + 11] = sa[ c     ];
			sa[ c - 22 + 12] = sa[ c + 1 ];

			// model matrix and z_order
			sa[ c - 22 + 15 ] = sa[ c + 4 ] = sa[ c + 15] = sa[ c + 26] = sa[ c + 37] = obj.transform[0];
			sa[ c - 22 + 16 ] = sa[ c + 5 ] = sa[ c + 16] = sa[ c + 27] = sa[ c + 38] = obj.transform[1];
			sa[ c - 22 + 17 ] = sa[ c + 6 ] = sa[ c + 17] = sa[ c + 28] = sa[ c + 39] = obj.transform[3];
			sa[ c - 22 + 18 ] = sa[ c + 7 ] = sa[ c + 18] = sa[ c + 29] = sa[ c + 40] = obj.transform[4];
			sa[ c - 22 + 19 ] = sa[ c + 8 ] = sa[ c + 19] = sa[ c + 30] = sa[ c + 41] = obj.transform[6];
			sa[ c - 22 + 20 ] = sa[ c + 9 ] = sa[ c + 20] = sa[ c + 31] = sa[ c + 42] = obj.transform[7];
			sa[ c - 22 + 21 ] = sa[ c + 10] = sa[ c + 21] = sa[ c + 32] = sa[ c + 43] = obj.z_order;
		}
		else
		{
			// model matrix and z_order (no degenerate triangle preceeds the first triangle in the strip)
			sa[ c + 4 ] = sa[ c + 15] = sa[ c + 26] = sa[ c + 37] = obj.transform[0];
			sa[ c + 5 ] = sa[ c + 16] = sa[ c + 27] = sa[ c + 38] = obj.transform[1];
			sa[ c + 6 ] = sa[ c + 17] = sa[ c + 28] = sa[ c + 39] = obj.transform[3];
			sa[ c + 7 ] = sa[ c + 18] = sa[ c + 29] = sa[ c + 40] = obj.transform[4];
			sa[ c + 8 ] = sa[ c + 19] = sa[ c + 30] = sa[ c + 41] = obj.transform[6];
			sa[ c + 9 ] = sa[ c + 20] = sa[ c + 31] = sa[ c + 42] = obj.transform[7];
			sa[ c + 10] = sa[ c + 21] = sa[ c + 32] = sa[ c + 43] = obj.z_order;
		}
	}

	// point the attributes at the buffer (stride and offset are in bytes, there are 4 bytes per gl.FLOAT)
    gl.bufferData( gl.ARRAY_BUFFER, sa, gl.STATIC_DRAW );
	gl.vertexAttribPointer( this.shaders.currentProgram.aPosition,     4, gl.FLOAT, false, 11 * 4,  0 * 4 );
	gl.vertexAttribPointer( this.shaders.currentProgram.aModelMatrix0, 2, gl.FLOAT, false, 11 * 4,  4 * 4 );
	gl.vertexAttribPointer( this.shaders.currentProgram.aModelMatrix1, 2, gl.FLOAT, false, 11 * 4,  6 * 4 );
	gl.vertexAttribPointer( this.shaders.currentProgram.aModelMatrix2, 3, gl.FLOAT, false, 11 * 4,  8 * 4 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, len * 6 - 2);		// four vertices per sprite plus two degenerate points, except for the last one
};


pbWebGl.prototype.reset = function()
{
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
   	gl.bindTexture( gl.TEXTURE_2D, null );
   	this.shaders.clearProgram();
	this.currentTexture = null;
};



pbWebGl.prototype.scissor = function(_x, _y, _width, _height)
{
	if (_x === undefined)
	{
		gl.disable(gl.SCISSOR_TEST);
	}
	else
	{
		gl.enable(gl.SCISSOR_TEST);
		// vertical coordinate system is inverted (0,0) is left, bottom of the screen
		gl.scissor(_x, gl.drawingBufferHeight - 1 - (_y + _height), _width, _height);
	}
};


// function clearDepthBuffer()
// {
// 	gl.clear(gl.DEPTH_BUFFER_BIT);
// }


// TODO: look into http://www.goocreate.com/learn/procedural-textures/

pbWebGl.prototype.createTextureFromCanvas = function(_canvas)
{
//	var ctx = _canvas.getContext('2d');
//	var p2width = nextHighestPowerOfTwo(_canvas.width);
//	var p2height = nextHighestPowerOfTwo(_canvas.height);

	var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // clamp to permit NPOT textures, no MIP mapping
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _canvas);

	// activate the texture
    this.currentTexture = texture;
    this.currentTexture.canvas = _canvas;
    gl.activeTexture( gl.TEXTURE0 );

	// create a buffer to transfer all the vertex position data through
	this.positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
};



pbWebGl.prototype.drawCanvasWithTransform = function( _canvas, _dirty, _transform, _z )
{
	this.shaders.setProgram(this.shaders.imageShaderProgram);

	if ( _dirty || !this.currentTexture || this.currentTexture.canvas !== _canvas )
		this.createTextureFromCanvas(_canvas);

	// split off a small part of the big buffer, for a single display object
	var sa = this.drawingArray.subarray(0, 16);

	// source rectangle
	var rect = new pbRectangle(0, 0, 1, 1);

	// half width, half height (of source frame)
	var wide, high;
	wide = _canvas.width;
	high = _canvas.height;

	var anchorX = 0.5;
	var anchorY = 0.5;

	// screen destination position
	// l, b,		0,1
	// l, t,		4,5
	// r, b,		8,9
	// r, t,		12,13
	var l = -wide * anchorX;
	var r = wide + l;
	var t = -high * anchorY;
	var b = high + t;
	sa[ 0 ] = sa[ 4 ] = l;
	sa[ 1 ] = sa[ 9 ] = b;
	sa[ 8 ] = sa[ 12] = r;
	sa[ 5 ] = sa[ 13] = t;

	// texture source position
	// x, b,		2,3
	// x, y,		6,7
	// r, b,		10,11
	// r, y,		14,15
	sa[ 2 ] = sa[ 6 ] = rect.x;
	sa[ 3 ] = sa[ 11] = rect.y + rect.height;
	sa[ 10] = sa[ 14] = rect.x + rect.width;
	sa[ 7 ] = sa[ 15] = rect.y;

    gl.bufferData( gl.ARRAY_BUFFER, sa, gl.STATIC_DRAW );

	// send the transform matrix to the vector shader
	gl.uniformMatrix3fv( this.shaders.currentProgram.matrixUniform, false, _transform );

	// set the depth value
   	gl.uniform1f( this.shaders.currentProgram.uZ, _z );

	// point the position attribute at the last bound buffer
    gl.vertexAttribPointer( this.shaders.currentProgram.aPosition, 4, gl.FLOAT, false, 0, 0 );

    // four vertices per quad, one quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};


pbWebGl.prototype.prepareTextureForCanvas = function()
{
	// make a framebuffer
	this.fb = gl.createFramebuffer();

	// make this the current frame buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

	// attach the texture to the framebuffer.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentTexture, 0);

	// check if you can read from this type of texture.
	this.canReadTexture = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);
};


// from http://www.html5rocks.com/en/tutorials/webgl/webgl_fundamentals/
// and https://html.spec.whatwg.org/multipage/scripting.html#pixel-manipulation
// and https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
pbWebGl.prototype.getTextureToCanvas = function(_ctx)
{
	if (this.canReadTexture && this.fb)
	{
		// make this the current frame buffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

		// attach the texture to the framebuffer again (to update the contents)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentTexture, 0);

		// get ImageData surface from the _canvas
		var canvas = _ctx.canvas;
		var imageData = _ctx.createImageData(canvas.width, canvas.height);

		// read the texture pixels into a typed array
		var buf8 = new Uint8Array(imageData.data.length);
		gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, buf8);

		// copy the typed array data into the ImageData surface
		var c = imageData.data.length;
		while(c--)
			imageData.data[c] = buf8[c];

		// put the ImageData on the _canvas
		_ctx.putImageData(imageData, 0, 0);

		// unbind the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

};




// check if value is a power of two 
function isPowerOfTwo(x)
{
    return ((x & (x - 1)) === 0);
}

 
// return the next highest power of two from this value (keep the value if it is already a power of two)
function nextHighestPowerOfTwo(x)
{
    --x;
    for (var i = 1; i < 32; i <<= 1)
    {
        x = x | x >> i;
    }
    return x + 1;
}
