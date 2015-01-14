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
		"    if (gl_FragColor.a < 0.80) discard;" +
		"  }",

	vertex:
		"  attribute vec4 aPosition;" +
		"  uniform float uZ;" +
		"  uniform mat3 uProjectionMatrix;" +
		"  uniform mat3 uModelMatrix;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    vec3 pos = uProjectionMatrix * uModelMatrix * vec3(aPosition.xy, 1);" +
		"    gl_Position = vec4(pos.xy, uZ, 1);" +
		"    vTexCoord = aPosition.zw;" +
		"  }"
};


/**
 * batchImageShaderSources - shaders for batch image drawing (fixed orientation and scale)
 * calculates the transform matrix from the values provided in the data buffer stream
 * @type {Array}
 */
var batchImageShaderSources = {
	fragment:
		"  precision mediump float;" +
		"  uniform sampler2D uImageSampler;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_FragColor = texture2D(uImageSampler, vTexCoord);" +
		"    if (gl_FragColor.a < 0.80) discard;" +
		"  }",

	vertex:
		"  attribute vec4 aPosition;" +
		"  attribute vec4 aTransform;" +
		"  attribute vec3 aTranslate;" +
		"  uniform mat3 uProjectionMatrix;" +
		"  varying vec2 vTexCoord;" +
		"  varying vec2 vAbsCoord;" +
		"  void main(void) {" +
		"    mat3 modelMatrix;" +
		"    modelMatrix[0] = vec3( aTransform.x * aTransform.z,-aTransform.y * aTransform.w, 0 );" +
		"    modelMatrix[1] = vec3( aTransform.y * aTransform.z, aTransform.x * aTransform.w, 0 );" +
		"    modelMatrix[2] = vec3( aTranslate.x, aTranslate.y, 1 );" +
		"    vec3 pos = uProjectionMatrix * modelMatrix * vec3( aPosition.xy, 1 );" +
		"    gl_Position = vec4(pos.xy, aTranslate.z, 1);" +
		"    vTexCoord = aPosition.zw;" +
		"  }"
};


/**
 * rawBatchImageShaderSources - shaders for batch image drawing (fixed orientation and scale)
 * requires the transform matrix in the data buffer stream
 * @type {Array}
 */
var rawBatchImageShaderSources = {
	fragment:
		"  precision mediump float;" +
		"  uniform sampler2D uImageSampler;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_FragColor = texture2D(uImageSampler, vTexCoord);" +
		"    if (gl_FragColor.a < 0.80) discard;" +
		"  }",

	vertex:
		"  attribute vec4 aPosition;" +
		"  attribute vec2 aModelMatrix0;" +
		"  attribute vec2 aModelMatrix1;" +
		"  attribute vec3 aModelMatrix2;" +
		"  uniform mat3 uProjectionMatrix;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    float z = aModelMatrix2.z;" +
		"    mat3 modelMatrix;" +
		"    modelMatrix[0] = vec3(aModelMatrix0, 0);" +
		"    modelMatrix[1] = vec3(aModelMatrix1, 0);" +
		"    modelMatrix[2] = vec3(aModelMatrix2.xy, 1);" +
		"    vec3 pos = uProjectionMatrix * modelMatrix * vec3(aPosition.xy, 1);" +
		"    gl_Position = vec4(pos.xy, z, 1);" +
		"    vTexCoord = aPosition.zw;" +
		"  }"
};


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
	this.rawBatchImageShaderProgram = null;
	this.bgVertexBuffer = null;
	this.bgColorBuffer = null;
	this.currentProgram = null;
	this.currentTexture = null;
	this.positionBuffer = null;
	this.onGPU = [];
	// pre-allocate the this.drawingArray to avoid memory errors from fragmentation (seen on Chrome (debug Version 39.0.2171.71 m) after running 75000 sprite demo for ~15 seconds)
	this.drawingArray = new Float32Array( MAX_SPRITES * (44 + 22) - 22 );
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
		this.rawBatchImageShaderProgram = this.initShaders( this.gl, rawBatchImageShaderSources );

		// enable the depth buffer so we can order our sprites
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);

		// set blending mode
		this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );
		this.gl.enable( this.gl.BLEND );

		// clear the render area
		this.gl.clearColor( 0.1, 0.2, 0.1, 1.0 );
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
		case this.rawBatchImageShaderProgram:
			this.clearRawBatchImageProgram();
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
	program.zUniform = gl.getUniformLocation( program, "uZ" );

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


pbWebGl.prototype.setRawBatchImageProgram = function()
{
	console.log( "pbWebGl.setRawBatchImageProgram" );

	this.clearProgram();
	
	var program = this.rawBatchImageShaderProgram;
	var gl = this.gl;

	gl.useProgram( program );

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.enableVertexAttribArray( program.aPosition );
	program.aModelMatrix0 = gl.getAttribLocation( program, "aModelMatrix0" );
	gl.enableVertexAttribArray( program.aModelMatrix0 );
	program.aModelMatrix1 = gl.getAttribLocation( program, "aModelMatrix1" );
	gl.enableVertexAttribArray( program.aModelMatrix1 );
	program.aModelMatrix2 = gl.getAttribLocation( program, "aModelMatrix2" );
	gl.enableVertexAttribArray( program.aModelMatrix2 );

	program.samplerUniform = gl.getUniformLocation( program, "uImageSampler" );
	program.projectionUniform = gl.getUniformLocation( program, "uProjectionMatrix" );
	program.zUniform = gl.getUniformLocation( program, "uZ" );

	this.currentTexture = null;

	return program;
};

pbWebGl.prototype.clearRawBatchImageProgram = function()
{
	console.log( "pbWebGl.clearRawBatchImageProgram" );

	var program = this.rawBatchImageShaderProgram;
	var gl = this.gl;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
	program.aModelMatrix0 = gl.getAttribLocation( program, "aModelMatrix0" );
	gl.disableVertexAttribArray( program.aModelMatrix0 );
	program.aModelMatrix1 = gl.getAttribLocation( program, "aModelMatrix1" );
	gl.disableVertexAttribArray( program.aModelMatrix1 );
	program.aModelMatrix2 = gl.getAttribLocation( program, "aModelMatrix2" );
	gl.disableVertexAttribArray( program.aModelMatrix2 );
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


pbWebGl.prototype.handleTexture = function( _image )
{
	// this _image is already the selected texture
	if (this.currentTexture && this.currentTexture.image === _image)
		return;

	var gl = this.gl;
	var index = this.onGPU.indexOf(_image);
	var texture = null;

    if (index != -1)
    {
		// the _image is already on the GPU
		texture = this.onGPU[index].gpuTexture;
    }
    else
    {
    	// upload it
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
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	    gl.generateMipmap(gl.TEXTURE_2D);

	    // remember that this texture has been uploaded
	    this.onGPU.push(_image);
	}

	// activate the texture
    this.currentTexture = texture;
    gl.activeTexture( gl.TEXTURE0 );
   	gl.bindTexture( gl.TEXTURE_2D, this.currentTexture );

   	// TODO: the rest of this stuff doesn't belong here...
   	gl.uniform1i( this.imageShaderProgram.samplerUniform, 0 );

	// create a buffer to transfer all the vertex position data through
	this.positionBuffer = this.gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );

	// set up the projection matrix in the vertex shader
	gl.uniformMatrix3fv( this.currentProgram.projectionUniform, false, pbMatrix3.makeProjection(gl.drawingBufferWidth, gl.drawingBufferHeight) );
};


pbWebGl.prototype.drawImageWithTransform = function( _transform, _z, _surface, cellFrame )
{
	var gl = this.gl;

	if ( this.currentProgram !== this.imageShaderProgram )
		this.currentProgram = this.setImageProgram();

	this.handleTexture( _surface.image );

	// split off a small part of the big buffer, for a single display object
	var sa = this.drawingArray.subarray(0, 20);

	// half width, half height (of source frame)
	var wide = _surface.cellWide * 0.5;
	var high = _surface.cellHigh * 0.5;

	// set up the animation frame
	var cell = Math.floor(cellFrame);
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

	// send the transform matrix to the vector shader
	gl.uniformMatrix3fv( this.currentProgram.matrixUniform, false, _transform );

	// set the depth value
   	gl.uniform1f( this.imageShaderProgram.zUniform, _z );

	// point the position attribute at the last bound buffer
    gl.vertexAttribPointer( this.currentProgram.aPosition, 4, gl.FLOAT, false, 0, 0 );

    // four vertices per quad, one quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};


pbWebGl.prototype.drawImage = function( _x, _y, _z, _surface, cellFrame, angle, scale )
{
	var gl = this.gl;

	if ( this.currentProgram !== this.imageShaderProgram )
		this.currentProgram = this.setImageProgram();

	this.handleTexture( _surface.image );

	// split off a small part of the big buffer, for a single display object
	var sa = this.drawingArray.subarray(0, 20);

	// half width, half height (of source frame)
	var wide = _surface.cellWide * 0.5;
	var high = _surface.cellHigh * 0.5;

	// set up the animation frame
	var cell = Math.floor(cellFrame);
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
	var matrix = pbMatrix3.makeTransform(_x, _y, angle, scale, scale);

	// var translationMatrix = pbMatrix3.makeTranslation(_x, _y);
	// var rotationMatrix = pbMatrix3.makeRotation(angle);
	// var scaleMatrix = pbMatrix3.makeScale(scale, scale);

	// var matrix = pbMatrix3.fastMultiply(rotationMatrix, scaleMatrix);
	// matrix = pbMatrix3.fastMultiply(matrix, translationMatrix);

	// send the matrix to the vector shader
	gl.uniformMatrix3fv( this.currentProgram.matrixUniform, false, matrix );

	// set the depth value
   	gl.uniform1f( this.imageShaderProgram.zUniform, _z );

	// point the position attribute at the last bound buffer
    gl.vertexAttribPointer( this.currentProgram.aPosition, 4, gl.FLOAT, false, 0, 0 );

    // four vertices per quad, one quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};


pbWebGl.prototype.batchDrawImages = function( list, _surface )
{
	var gl = this.gl;

	if ( this.currentProgram !== this.batchImageShaderProgram )
		this.currentProgram = this.setBatchImageProgram();

	this.handleTexture( _surface.image );

	// half width, half height (of source frame)
	var wide = _surface.cellWide * 0.5;
	var high = _surface.cellHigh * 0.5;

	// TODO: generate warning if length is capped
	var len = Math.min(list.length, MAX_SPRITES);

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
    var sa = this.drawingArray.subarray(0, len * (44 + 22) - 22);

	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
	for ( var i = -1, c = 0; ++i < len; c += 44 )
	{
		// set up texture reference coordinates based on the image frame number
		var img = list[i].img;
		var cell = Math.floor(list[i].cell);
		var cx = cell % img.cellsWide;
		var cy = Math.floor(cell / img.cellsWide);
		var rect = img.cellTextureBounds[cx][cy];
		var tex_x = rect.x;
		var tex_y = rect.y;
		var tex_r = rect.x + rect.width;
		var tex_b = rect.y + rect.height;

		var cos = -Math.cos(list[i].angle);
		var sin = Math.sin(list[i].angle);
		var scale = list[i].scale;
		var x = Math.round(list[i].x);
		var y = Math.round(list[i].y);
		var z = list[i].z;

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
	gl.vertexAttribPointer( this.currentProgram.aPosition , 4, gl.FLOAT, false, 11 * 4, 0 * 4 );
	gl.vertexAttribPointer( this.currentProgram.aTransform, 4, gl.FLOAT, false, 11 * 4, 4 * 4 );
	gl.vertexAttribPointer( this.currentProgram.aTranslate, 3, gl.FLOAT, false, 11 * 4, 8 * 4 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, len * 6 - 2);		// four vertices per sprite plus two degenerate points
};


// list objects: { renderer: this.renderer, transform: pbMatrix3, corners: Array, z_order: Number, surface: pbSurface, cellFrame: Number }
pbWebGl.prototype.rawBatchDrawImages = function( list )
{
	var gl = this.gl;
	var surface = list[0].surface;

	if ( this.currentProgram !== this.rawBatchImageShaderProgram )
		this.currentProgram = this.setRawBatchImageProgram();

	this.handleTexture( surface.image );

	// half width, half height (of source frame)
	var wide = surface.cellWide * 0.5;
	var high = surface.cellHigh * 0.5;

	// TODO: generate warning if length is capped
	var len = Math.min(list.length, MAX_SPRITES);

	// store local reference to avoid extra scope resolution (http://www.slideshare.net/nzakas/java-script-variable-performance-presentation)
    var sa = this.drawingArray.subarray(0, len * (44 + 22) - 22);


	// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
	for ( var i = -1, c = 0; ++i < len; c += 44 )
	{
		var obj = list[i];

		// set up texture reference coordinates based on the image frame number
		var cell = Math.floor(obj.cellFrame);
		var cx = cell % surface.cellsWide;
		var cy = Math.floor(cell / surface.cellsWide);
		var rect = surface.cellTextureBounds[cx][cy];
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
		if (obj.corners)
		{
			// object has corner offets (skewing/perspective etc)
			sa[ c     ] = obj.corners.lbx * -wide; sa[ c + 1 ] = obj.corners.lby *  high;
			sa[ c + 11] = obj.corners.ltx * -wide; sa[ c + 12] = obj.corners.lty * -high;
			sa[ c + 22] = obj.corners.rbx *  wide; sa[ c + 23] = obj.corners.rby *  high;
			sa[ c + 33] = obj.corners.rtx *  wide; sa[ c + 34] = obj.corners.rty * -high;
		}
		else
		{
			sa[ c     ] = -wide; sa[ c + 1 ] =  high;
			sa[ c + 11] = -wide; sa[ c + 12] = -high;
			sa[ c + 22] =  wide; sa[ c + 23] =  high;
			sa[ c + 33] =  wide; sa[ c + 34] = -high;
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
	gl.vertexAttribPointer( this.currentProgram.aPosition,     4, gl.FLOAT, false, 11 * 4,  0 * 4 );
	gl.vertexAttribPointer( this.currentProgram.aModelMatrix0, 2, gl.FLOAT, false, 11 * 4,  4 * 4 );
	gl.vertexAttribPointer( this.currentProgram.aModelMatrix1, 2, gl.FLOAT, false, 11 * 4,  6 * 4 );
	gl.vertexAttribPointer( this.currentProgram.aModelMatrix2, 3, gl.FLOAT, false, 11 * 4,  8 * 4 );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, len * 6 - 2);		// four vertices per sprite plus two degenerate points, except for the last one
};


pbWebGl.prototype.reset = function()
{
    this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );
   	this.gl.bindTexture( this.gl.TEXTURE_2D, null );
   	this.clearProgram();
	this.currentProgram = null;
	this.currentTexture = null;
};

