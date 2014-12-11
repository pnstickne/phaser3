/**
 *
 * WebGL support code
 *
 */




/**
 * imageShaderSources - shaders for image drawing including matrix transforms for scalex,scaley, rotation and translation
 * @type {Array}
 */
var imageShaderSources = {
	fragment:
		"  precision mediump float;" +
		"  uniform sampler2D uImageSampler;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_FragColor = texture2D(uImageSampler, vTexCoord);" +
		"  }",

	vertex:
		"  attribute vec4 aPosition;" +
		"  uniform mat3 uProjectionMatrix;" +
		"  uniform mat3 uModelMatrix;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_Position = vec4(uProjectionMatrix * uModelMatrix * vec3(aPosition.xy, 1), 1);" +
		"    vTexCoord = aPosition.zw;" +
		"  }"
};


/**
 * batchImageShaderSources - shaders for batch image drawing (fixed orientation and scale)
 * @type {Array}
 */
var batchImageShaderSources = {
	fragment:
		"  precision mediump float;" +
		"  uniform sampler2D uImageSampler;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_FragColor = texture2D(uImageSampler, vTexCoord);" +
		"  }",

	vertex:
		"  attribute vec4 aPosition;" +
		"  attribute vec4 aTransform;" +
		"  attribute vec2 aTranslate;" +
		"  uniform mat3 uProjectionMatrix;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    mat3 modelMatrix;" +
		"    modelMatrix[0] = vec3( aTransform.x * aTransform.z,-aTransform.y * aTransform.w, 0);" +
		"    modelMatrix[1] = vec3( aTransform.y * aTransform.z, aTransform.x * aTransform.w, 0);" +
		"    modelMatrix[2] = vec3( aTranslate.x, aTranslate.y, 1);" +
		"    gl_Position = vec4(uProjectionMatrix * modelMatrix * vec3(aPosition.xy, 1), 1);" +
		"    vTexCoord = aPosition.zw;" +
		"  }"
};

		// "  attribute vec4 aPosition;" +
		// "  attribute vec4 aTransform;" +
		// "  attribute vec2 aTranslate;" +
		// "  uniform mat3 uProjectionMatrix;" +
		// "  varying vec2 vTexCoord;" +
		// "  void main(void) {" +
		// "    mat3 modelMatrix;" +
		// "    modelMatrix[0] = vec3( aTransform.x * aTransform.z,-aTransform.y * aTransform.w, 0);" +
		// "    modelMatrix[1] = vec3( aTransform.y * aTransform.z, aTransform.x * aTransform.w, 0);" +
		// "    modelMatrix[2] = vec3( aTranslate.x, aTranslate.y, 1);" +
		// "    gl_Position = vec4(uProjectionMatrix * modelMatrix * vec3(aPosition.xy, 1), 1);" +
		// "    vTexCoord = aPosition.zw;" +
		// "  }"

		// "  attribute vec4 aPosition;" +
		// "  attribute vec4 aTransform;" +
		// "  attribute vec2 aTranslate;" +
		// "  uniform mat3 uProjectionMatrix;" +
		// "  varying vec2 vTexCoord;" +
		// "  void main(void) {" +
		// "    mat3 modelMatrix;" +
		// "    modelMatrix[0] = vec3( aTransform.x * aTransform.z, aTransform.y * aTransform.z, aTranslate.x);" +
		// "    modelMatrix[1] = vec3(-aTransform.y * aTransform.w, aTransform.x * aTransform.w, aTranslate.y);" +
		// "    modelMatrix[2] = vec3(0, 0, 1);" +
		// "    gl_Position = vec4(uProjectionMatrix * modelMatrix * vec3(aPosition.xy, 1), 1);" +
		// "    vTexCoord = aPosition.zw;" +
		// "  }"

/**
 * graphicsShaderSources - shaders for graphics primitive drawing
 * @type {Array}
 */
var graphicsShaderSources = {
	fragment:
		"  precision mediump float;" +
		"  varying vec4 vColor;" +
		"  void main(void) {" +
		"    gl_FragColor = vColor;" +
		"  }",

	vertex:
		"  uniform vec2 resolution;" +
		"  attribute vec2 aPosition;" +
		"  attribute vec4 color;" +
		"  varying vec4 vColor;" +
		"  void main(void) {" +
		"    vec2 zeroToOne = aPosition / resolution;" +
		"    vec2 zeroToTwo = zeroToOne * 2.0;" +
		"    vec2 clipSpace = zeroToTwo - 1.0;" +
		"    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);" +
		"    vColor = color;" +
		"  }"
};


var MAX_SPRITES = 100000;


function pbWebGl()
{
	console.log( "pbWebGl c'tor" );
	this.gl = null;
	this.graphicsShaderProgram = null;
	this.imageShaderProgram = null;
	this.batchImageShaderProgram = null;
	this.bgVertexBuffer = null;
	this.bgColorBuffer = null;
	this.currentProgram = null;
	this.currentTexture = null;
	this.positionBuffer = null;
	// pre-allocate the this.drawingArray to avoid memory errors from fragmentation (seen on Chrome (debug Version 39.0.2171.71 m) after running 75000 sprite demo for ~15 seconds)
	this.drawingArray = new Float32Array( MAX_SPRITES * 80 );
}


pbWebGl.prototype.initGL = function( canvas )
{
	// https://www.khronos.org/webgl/wiki/FAQ
	if ( window.WebGLRenderingContext )
	{
		console.log( "pbWebGl.initGl" );
		try
		{
			//this.gl = canvas.getContext( "webgl" );
			this.gl = canvas.getContext( "webgl", { alpha: false } );
			if (!this.gl)	// support IE11, lagging behind as usual
				this.gl = canvas.getContext( "experimental-webgl", { alpha: false } );
		}
		catch ( e )
		{
			alert( "WebGL initialisation error: ", e.message );
			return null;
		}

		// if this version can't use textures, it's useless to us
		var numTexturesAvailableInVertexShader = this.gl.getParameter( this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS );
		if ( numTexturesAvailableInVertexShader === 0 )
		{
			this.gl = null;
			return null;
		}

		// create the shader programs for each drawing mode
		this.graphicsShaderProgram = this.initShaders( this.gl, graphicsShaderSources );
		this.imageShaderProgram = this.initShaders( this.gl, imageShaderSources );
		this.batchImageShaderProgram = this.initShaders( this.gl, batchImageShaderSources );

		// clear the render area to a dim red (so I can tell when webgl breaks)
		this.gl.clearColor( 0.2, 0.0, 0.0, 1.0 );
		this.gl.clearDepth( 1.0 );

		// precalculate the drawing buffer's half-width and height values
		this.screenWide2 = this.gl.drawingBufferWidth * 0.5;
		this.screenHigh2 = this.gl.drawingBufferHeight * 0.5;
		// calculate inverse to avoid division in loop
		this.iWide = 1.0 / this.screenWide2;
		this.iHigh = 1.0 / this.screenHigh2;

		return this.gl;
	}
	return null;
};


pbWebGl.prototype.preRender = function()
{
	// clear the viewport
	this.gl.viewport( 0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight );
	this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

	// set blending mode
	this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );
	this.gl.enable( this.gl.BLEND );
};


pbWebGl.prototype._getShader = function( gl, sources, typeString )
{
	// work out which type it is
	var type;
	switch ( typeString )
	{
		case "fragment":
			type = gl.FRAGMENT_SHADER;
			break;
		case "vertex":
			type = gl.VERTEX_SHADER;
			break;
		default:
			alert( "Unrecognised shader type: " + typeString );
			return null;
	}

	// create the correct shader type
	var shader = gl.createShader( type );

	// provide the shader source
	var source = sources[ typeString ];
	gl.shaderSource( shader, source );

	// compile the shader (and check for errors)
	gl.compileShader( shader );
	var status = gl.getShaderParameter( shader, gl.COMPILE_STATUS );
	if ( !status )
	{
		alert( "Shader compile error: " + gl.getShaderInfoLog( shader ) + "\n(" + typeString + ")" );
		gl.deleteShader( shader );
		return null;
	}

	return shader;
};


// originally from http://learningwebgl.com/
pbWebGl.prototype.initShaders = function( gl, graphicsShaderSources )
{
	console.log( "pbWebGl.initShaders" );

	// create an empty shader program
	var program = gl.createProgram();

	// get the fragment shader and attach it to the program
	var fragmentShader = this._getShader( gl, graphicsShaderSources, "fragment" );
	gl.attachShader( program, fragmentShader );

	// get the vertex shader and attach it to the program
	var vertexShader = this._getShader( gl, graphicsShaderSources, "vertex" );
	gl.attachShader( program, vertexShader );

	// link the attached shaders to the program
	gl.linkProgram( program );
	if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) )
	{
		alert( "Could not initialise shaders: ", gl.getProgramInfoLog( program ) );
		gl.deleteProgram( program );
		program = null;
		return null;
	}
	return program;
};


/**
 * http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
 *
 * I'm really not sure if it's relevant as I'm not hot-swapping shaders yet...
 */
pbWebGl.prototype.clearProgram = function()
{
	switch(this.currentProgram)
	{
		case this.graphicsShaderProgram:
			this.clearGraphicsProgram();
			break;
		case this.imageShaderProgram:
			this.clearImageProgram();
			break;
		case this.batchImageShaderProgram:
			this.clearBatchImageProgram();
			break;
	}
};


pbWebGl.prototype.setGraphicsProgram = function()
{
	console.log( "pbWebGl.setGraphicsProgram" );

	this.clearProgram();
	
	var program = this.graphicsShaderProgram;
	var gl = this.gl;

	// set the shader program
	gl.useProgram( program );

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.enableVertexAttribArray( program.aPosition );

	program.color = gl.getAttribLocation( program, "color" );
	gl.enableVertexAttribArray( program.color );

	return program;
};

pbWebGl.prototype.clearGraphicsProgram = function()
{
	console.log( "pbWebGl.clearGraphicsProgram" );

	var program = this.graphicsShaderProgram;
	var gl = this.gl;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
	program.color = gl.getAttribLocation( program, "color" );
	gl.disableVertexAttribArray( program.color );
};


pbWebGl.prototype.setImageProgram = function()
{
	console.log( "pbWebGl.setImageProgram" );

	this.clearProgram();
	
	var program = this.imageShaderProgram;
	var gl = this.gl;

	gl.useProgram( program );

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.enableVertexAttribArray( program.aPosition );

	program.samplerUniform = gl.getUniformLocation( program, "uImageSampler" );
	program.matrixUniform = gl.getUniformLocation( program, "uModelMatrix" );
	program.projectionUniform = gl.getUniformLocation( program, "uProjectionMatrix" );

	this.currentTexture = null;

	return program;
};

pbWebGl.prototype.clearImageProgram = function()
{
	console.log( "pbWebGl.clearImageProgram" );

	var program = this.imageShaderProgram;
	var gl = this.gl;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
};


pbWebGl.prototype.setBatchImageProgram = function()
{
	console.log( "pbWebGl.setBatchImageProgram" );

	this.clearProgram();
	
	var program = this.batchImageShaderProgram;
	var gl = this.gl;

	gl.useProgram( program );

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.enableVertexAttribArray( program.aPosition );
	program.aTransform = gl.getAttribLocation( program, "aTransform" );
	gl.enableVertexAttribArray( program.aTransform );
	program.aTranslate = gl.getAttribLocation( program, "aTranslate" );
	gl.enableVertexAttribArray( program.aTranslate );

	program.samplerUniform = gl.getUniformLocation( program, "uImageSampler" );
	program.projectionUniform = gl.getUniformLocation( program, "uProjectionMatrix" );

	this.currentTexture = null;

	return program;
};

pbWebGl.prototype.clearBatchImageProgram = function()
{
	console.log( "pbWebGl.clearBatchImageProgram" );

	var program = this.batchImageShaderProgram;
	var gl = this.gl;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
	program.aTransform = gl.getAttribLocation( program, "aTransform" );
	gl.disableVertexAttribArray( program.aTransform );
};


pbWebGl.prototype.fillRect = function( x, y, wide, high, color )
{
	console.log( "pbWebGl.fillRect" );

	var program = this.graphicsShaderProgram;
	var gl = this.gl;

	if ( this.currentProgram !== program )
		this.currentProgram = this.setGraphicsProgram();

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
	gl.vertexAttribPointer( program.aPosition, 2, gl.FLOAT, gl.FALSE, 0, 0 );

	gl.bindBuffer( gl.ARRAY_BUFFER, this.bgColorBuffer );
	gl.vertexAttribPointer( program.color, 4, gl.FLOAT, gl.FALSE, 0, 0 );

	gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.bgVertexBuffer.numPoints );
};


pbWebGl.prototype.handleTexture = function( image )
{
	console.log( "pbWebGl.handleTexture" );

	var gl = this.gl;

    var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (image.width > maxSize || image.height > maxSize)
    {
	    alert("ERROR: Texture size not supported by this video card!", image.width, image.height, " > ", maxSize);
	    return null;
    }

	var texture = gl.createTexture();
	texture.image = image;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

	return texture;
};


pbWebGl.prototype.drawImage = function( _x, _y, image, angle, scale )
{
	var gl = this.gl;

	if ( this.currentProgram !== this.imageShaderProgram )
		this.currentProgram = this.setImageProgram();

	if ( !this.currentTexture || this.currentTexture.image !== image )
	{
		// prepare the texture
		this.currentTexture = this.handleTexture( image );
	    gl.activeTexture( gl.TEXTURE0 );
	   	gl.bindTexture( gl.TEXTURE_2D, this.currentTexture );
	   	gl.uniform1i( this.imageShaderProgram.samplerUniform, 0 );
		// create a buffer to transfer all the vertex position data through
		this.positionBuffer = this.gl.createBuffer();
	    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
		// set up the projection matrix in the vertex shader
		gl.uniformMatrix3fv( this.currentProgram.projectionUniform, false, pbMatrix.makeProjection(gl.drawingBufferWidth, gl.drawingBufferHeight) );

		// split off a small part of the big buffer, for a single display object
		// IE uses first index/last index inclusive [http://msdn.microsoft.com/en-us/library/ie/br230723(v=vs.94).aspx], Chrome uses first index/last index exclusive as specified [https://www.khronos.org/registry/typedarray/specs/latest/]
		var sa = this.drawingArray.subarray(0, 15);
		if (sa.length === 15) sa = this.drawingArray.subarray(0, 16);

		// screen destination position
		// l, b,		0,1
		// l, t,		4,5
		// r, b,		8,9
		// r, t,		12,13
		var wide = image.width * 0.5;
		var high = image.height * 0.5;
		sa[ 0 ] = sa[ 4 ] = -wide;
		sa[ 1 ] = sa[ 9 ] =  high;
		sa[ 8 ] = sa[ 12] =  wide;
		sa[ 5 ] = sa[ 13] = -high;

		// texture source position
		// 0, 0,		2,3
		// 0, 1,		6,7
		// 1, 0,		10,11
		// 1, 1,		14,15
		sa[ 2 ] = sa[ 6 ] = sa[ 3 ] = sa[ 11] = 0;
		sa[ 10] = sa[ 14] = sa[ 7 ] = sa[ 15] = 1;

	    gl.bufferData( gl.ARRAY_BUFFER, sa, gl.STATIC_DRAW );
	    this.positionBuffer.itemSize = 4;
	    this.positionBuffer.numItems = sa.length / this.positionBuffer.itemSize;
	}

	// TODO: most of these are semi-static, cache them
	var translationMatrix = pbMatrix.makeTranslation(_x, _y);
	var rotationMatrix = pbMatrix.makeRotation(angle);
	var scaleMatrix = pbMatrix.makeScale(scale, scale);

	var matrix = pbMatrix.fastMultiply(rotationMatrix, scaleMatrix);
	matrix = pbMatrix.fastMultiply(matrix, translationMatrix);

	// send the matrix to the vector shader
	gl.uniformMatrix3fv( this.currentProgram.matrixUniform, false, matrix );

	// point the position attribute at the last bound buffer
    gl.vertexAttribPointer( this.currentProgram.aPosition, this.positionBuffer.itemSize, gl.FLOAT, false, 0, 0 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
};


pbWebGl.prototype.batchDrawImages = function( list, image )
{
	var gl = this.gl;

	if ( this.currentProgram !== this.batchImageShaderProgram )
		this.currentProgram = this.setBatchImageProgram();

	if ( !this.currentTexture || this.currentTexture.image !== image )
	{
		this.currentTexture = this.handleTexture( image );
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.currentTexture );
		gl.uniform1i( this.currentProgram.samplerUniform, 0 );
		// create a buffer to transfer all the vertex position data through
		this.positionBuffer = this.gl.createBuffer();
		// set up the projection matrix in the vertex shader
		gl.uniformMatrix3fv( this.currentProgram.projectionUniform, false, pbMatrix.makeProjection(gl.drawingBufferWidth, gl.drawingBufferHeight) );
	}

	// TODO: generate warning if length is capped
	var len = Math.min(list.length, MAX_SPRITES);

	// half width, half height (of source image)
	var wide = image.width * 0.5;
	var high = image.height * 0.5;

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
    var sa = this.drawingArray.subarray(0, len * 80 - 40);

	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
	for ( var i = -1, c = 0; ++i < len; c += 40 )
	{
		var sin = Math.sin(list[i].angle);
		var cos = Math.cos(list[i].angle);
		var scale = list[i].scale;
		var x = list[i].x;
		var y = list[i].y;

		if ( i > 0 )
		{
			// degenerate triangle: repeat the last vertex
			sa[ c     ] = wide;					// old r
			sa[ c + 1 ] = -high;				// old t
			sa[ c + 4 ] = sa[ c - 40 + 34 ];	// old sin
			sa[ c + 5 ] = sa[ c - 40 + 35 ];	// old cos
			sa[ c + 6 ] = sa[ c - 40 + 36 ];	// old scale
			sa[ c + 7 ] = sa[ c - 40 + 37 ];	// old scale
			sa[ c + 8 ] = sa[ c - 40 + 38 ];	// old x
			sa[ c + 9 ] = sa[ c - 40 + 39 ];	// old y
		 	// repeat the next vertex to fill out this entire stride
			sa[ c + 10] = sa[ c + 20] = sa[ c + 30] = -wide;		// l
		 	sa[ c + 11] = sa[ c + 21] = sa[ c + 31] = high;			// b
			sa[ c + 34 ] = sin;
			sa[ c + 35 ] = cos;
			sa[ c + 36 ] = scale;
			sa[ c + 37 ] = scale;
			sa[ c + 38] = x;
			sa[ c + 39] = y;
			c += 40;
		}

		// screen destination position
		// l, b,		0,1
		// l, t,		10,11
		// r, b,		20,21
		// r, t,		30,31
		sa[ c     ] = sa[ c + 10] = -wide;		// l
		sa[ c + 1 ] = sa[ c + 21] =  high;		// b
		sa[ c + 20] = sa[ c + 30] =  wide;		// r
		sa[ c + 11] = sa[ c + 31] = -high;		// t

		// texture source position
		// 0, 0,		2,3
		// 0, 1,		12,13
		// 1, 0,		22,23
		// 1, 1,		32,33
		sa[ c + 2 ] = sa[ c + 12] = sa[ c + 3 ] = sa[ c + 23] = 0;
		sa[ c + 22] = sa[ c + 32] = sa[ c + 13] = sa[ c + 33] = 1;

		// rotation sin & cos components
		//  4, 5
		// 14,15
		// 24,25
		// 34,34
		sa[ c + 4 ] = sa[ c + 14] = sa[ c + 24] = sa[ c + 34] = sin;
		sa[ c + 5 ] = sa[ c + 15] = sa[ c + 25] = sa[ c + 35] = cos;

		// scaling sx & sy components
		//  6, 7
		// 16,17
		// 26,27
		// 36,37
		sa[ c + 6 ] = sa[ c + 16] = sa[ c + 26] = sa[ c + 36] = scale;
		sa[ c + 7 ] = sa[ c + 17] = sa[ c + 27] = sa[ c + 37] = scale;

		// world translation
		sa[ c + 8 ] = sa[ c + 18] = sa[ c + 28] = sa[ c + 38] = x;
		sa[ c + 9 ] = sa[ c + 19] = sa[ c + 29] = sa[ c + 39] = y;
	}

	// point the attributes at the buffer (stride and offset are in bytes, there are 4 bytes per gl.FLOAT)
    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, sa, gl.STATIC_DRAW );
	gl.vertexAttribPointer( this.currentProgram.aPosition , 4, gl.FLOAT, false, 10 * 4, 0 * 4 );
	gl.vertexAttribPointer( this.currentProgram.aTransform, 4, gl.FLOAT, false, 10 * 4, 4 * 4 );
	gl.vertexAttribPointer( this.currentProgram.aTranslate, 2, gl.FLOAT, false, 10 * 4, 8 * 4 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, len * 4);		// four vertices per sprite
};


pbWebGl.prototype.reset = function()
{
    this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );
   	this.gl.bindTexture( this.gl.TEXTURE_2D, null );
   	this.clearProgram();
	this.currentProgram = null;
	this.currentTexture = null;
};

