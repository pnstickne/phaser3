/**
 *
 * WebGL wrapper.
 *
 */


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
		"  attribute vec2 position;" +
		"  attribute vec4 color;" +
		"  varying vec4 vColor;" +
		"  void main(void) {" +
		"    vec2 zeroToOne = position / resolution;" +
		"    vec2 zeroToTwo = zeroToOne * 2.0;" +
		"    vec2 clipSpace = zeroToTwo - 1.0;" +
		"    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);" +
		"    vColor = color;" +
		"  }"
};


/**
 * imageShaderSources - shaders for image drawing
 * @type {Array}
 */
var imageShaderSources = {
	fragment:
		"  precision mediump float;" +
		"  uniform sampler2D imageSampler;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    vec4 col;" +
		"    col = texture2D(imageSampler, vTexCoord);" +
		"    gl_FragColor = col;" +
		"  }",

	vertex:
		"  attribute vec4 position;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_Position.zw = vec2(1, 1);" +
		"    gl_Position.xy = position.xy;" +
		"    vTexCoord = position.zw;" +
		"  }"
};


var MAX_SPRITES = 100000;


function pbWebGl()
{
	console.log( "pbWebGl c'tor" );
	this.gl = null;
	this.graphicsShaderProgram = null;
	this.bgVertexBuffer = null;
	this.bgColorBuffer = null;
	this.currentProgram = null;
	this.currentTexture = null;
	this.positionBuffer = null;
	// pre-allocate the this.quadArray to avoid memory errors from fragmentation (seen on Chrome (debug Version 39.0.2171.71 m) after running 75000 sprite demo for 15 seconds)
	this.quadArray = new Float32Array( MAX_SPRITES * 24 - 8 );		// -8 because the last one isn't followed by a degenerate triangle
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

		// clear the render area to a dim red (so I can tell when webgl breaks)
		this.gl.clearColor( 0.2, 0.0, 0.0, 1.0 );
		this.gl.clearDepth( 1.0 );
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


pbWebGl.prototype.setGraphicsProgram = function()
{
	console.log( "pbWebGl.setGraphicsProgram" );

	var program = this.graphicsShaderProgram;
	var gl = this.gl;

	// set the shader program
	gl.useProgram( program );

	// remember location of shader attribute variables
	// program.resolution = gl.getUniformLocation( program, "resolution" );

	program.position = gl.getAttribLocation( program, "position" );
	gl.enableVertexAttribArray( program.position );

	program.color = gl.getAttribLocation( program, "color" );
	gl.enableVertexAttribArray( program.color );

	return program;
};


pbWebGl.prototype.setImageProgram = function()
{
	console.log( "pbWebGl.setImageProgram" );

	var program = this.imageShaderProgram;
	var gl = this.gl;

	gl.useProgram( program );

	program.position = gl.getAttribLocation( program, "position" );
	gl.enableVertexAttribArray( program.position );

	program.samplerUniform = gl.getUniformLocation( program, "imageSampler" );

	this.currentTexture = null;

	return program;
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
	gl.vertexAttribPointer( program.position, 2, gl.FLOAT, gl.FALSE, 0, 0 );

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


pbWebGl.prototype.drawImage = function( _x, _y, image )
{
	var gl = this.gl;

	if ( this.currentProgram !== this.imageShaderProgram )
		this.currentProgram = this.setImageProgram();
	if ( !this.currentTexture || this.currentTexture.image !== image )
	{
		this.currentTexture = this.handleTexture( image );
	    gl.activeTexture( gl.TEXTURE0 );
	   	gl.bindTexture( gl.TEXTURE_2D, this.currentTexture );
	   	gl.uniform1i( this.imageShaderProgram.samplerUniform, 0 );
		// create a buffer to transfer all the vertex position data through
		this.positionBuffer = this.gl.createBuffer();
	    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
	}

	var screenWide2 = gl.drawingBufferWidth * 0.5;
	var screenHigh2 = gl.drawingBufferHeight * 0.5;

	// calculate inverse to avoid division in loop
	var iWide = 1.0 / screenWide2;
	var iHigh = 1.0 / screenHigh2;

	var scale = 1.0;
	var wide = image.width * scale * 0.5 / screenWide2;
	var high = image.height * scale * 0.5 / screenHigh2;

	// create a new small buffer for a single display object
	var qa = new Float32Array(16);

	var x = _x * iWide - 1;
	var y = -_y * iHigh + 1;
	var l = x - wide;
	var b = y + high;

	// screen destination position
	// l, b,		0,1
	// l, t,		4,5
	// r, b,		8,9
	// r, t,		12,13

	qa[ 0 ] = qa[ 4 ] = l;
	qa[ 1 ] = qa[ 9 ] = b;
	qa[ 8 ] = qa[ 12] = x + wide;
	qa[ 5 ] = qa[ 13] = y - high;

	// texture source position
	// 0, 0,		2,3
	// 0, 1,		6,7
	// 1, 0,		10,11
	// 1, 1,		14,15
	qa[ 2 ] = qa[ 6] = qa[ 3 ] = qa[ 11] = 0;
	qa[ 10] = qa[ 14] = qa[ 7 ] = qa[ 15] = 1;

    gl.bufferData( gl.ARRAY_BUFFER, qa, gl.STATIC_DRAW );
    this.positionBuffer.itemSize = 4;
    this.positionBuffer.numItems = 16 / this.positionBuffer.itemSize;
    gl.vertexAttribPointer( this.imageShaderProgram.position, this.positionBuffer.itemSize, gl.FLOAT, false, 0, 0 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
};


pbWebGl.prototype.batchDrawImages = function( list, image )
{
	var gl = this.gl;

	if ( this.currentProgram !== this.imageShaderProgram )
		this.currentProgram = this.setImageProgram();

	if ( !this.currentTexture || this.currentTexture.image !== image )
	{
		this.currentTexture = this.handleTexture( image );
	    gl.activeTexture( gl.TEXTURE0 );
	   	gl.bindTexture( gl.TEXTURE_2D, this.currentTexture );
	   	gl.uniform1i( this.imageShaderProgram.samplerUniform, 0 );
		// create a buffer to transfer all the vertex position data through
		this.positionBuffer = this.gl.createBuffer();
	}

	var screenWide2 = gl.drawingBufferWidth * 0.5;
	var screenHigh2 = gl.drawingBufferHeight * 0.5;

	// calculate inverse to avoid division in loop
	var iWide = 1.0 / screenWide2;
	var iHigh = 1.0 / screenHigh2;

	// TODO: generate warning if length is capped
	var len = Math.min(list.length, MAX_SPRITES);

	var scale = 0.10;	// make them smaller so we can see the difference between 5000 and 10000
	var wide = image.width * scale * 0.5 / screenWide2;
	var high = image.height * scale * 0.5 / screenHigh2;

	var old_t;
	var old_r;

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
	var qa = this.quadArray;

	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
	for ( var i = -1, c = 0; ++i < len; c += 16 )
	{
		var x = list[ i ].x * iWide - 1;
		var y = 1 - list[ i ].y * iHigh;
		var l = x - wide;
		var b = y + high;

		if ( i > 0 )
		{
			// degenerate triangle: repeat the last vertex
			qa[ c     ] = old_r;
			qa[ c + 1 ] = old_t;
		 	// repeat the next vertex
			qa[ c + 4 ] = l;
		 	qa[ c + 5 ] = b;
		 	// texture coordinates are unused
			//qa[ c + 2 ] = qa[ c + 3 ] = qa[ c + 6 ] = qa[ c + 7 ] = 0;
			c += 8;
		}

		// screen destination position
		// l, b,		0,1
		// l, t,		4,5
		// r, b,		8,9
		// r, t,		12,13

		qa[ c     ] = qa[ c + 4 ] = l;
		qa[ c + 1 ] = qa[ c + 9 ] = b;
		qa[ c + 8 ] = qa[ c + 12] = old_r = x + wide;
		qa[ c + 5 ] = qa[ c + 13] = old_t = y - high;

		// texture source position
		// 0, 0,		2,3
		// 0, 1,		6,7
		// 1, 0,		10,11
		// 1, 1,		14,15
		qa[ c + 2 ] = qa[ c + 6] = qa[ c + 3 ] = qa[ c + 11] = 0;
		qa[ c + 10] = qa[ c + 14] = qa[ c + 7 ] = qa[ c + 15] = 1;
	}


    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, qa, gl.STREAM_DRAW );
    this.positionBuffer.itemSize = 4;
    this.positionBuffer.numItems = (len * 24 - 8) / this.positionBuffer.itemSize;		// -8 because the last one isn't followed by a degenerate point pair
    gl.vertexAttribPointer( this.imageShaderProgram.position, this.positionBuffer.itemSize, gl.FLOAT, false, 0, 0 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);

    gl.bindBuffer( gl.ARRAY_BUFFER, null );
};


pbWebGl.prototype.reset = function()
{
    this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );
   	this.gl.bindTexture( this.gl.TEXTURE_2D, null );
	this.currentProgram = null;
	this.currentTexture = null;
};

