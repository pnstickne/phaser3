/**
 *
 * pbShaders.js - data and support code for webGl shaders
 * 
 */



/**
 * blitShaderSources - shaders for image blitting 
 * no transform in the shader, simple particles
 * data = 24 floats per quad (4 corners * x,y,u,v plus 2 degenerate triangles to separate them)
 * @type {Array}
 */
var blitShaderSources = {
	fragment:
		"  precision lowp float;" +
		"  uniform sampler2D uImageSampler;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_FragColor = texture2D(uImageSampler, vTexCoord);" +
		"  }",

	vertex:
		"  precision lowp float;" +
		"  attribute vec4 aPosition;" +
		"  varying vec2 vTexCoord;" +
		"  void main(void) {" +
		"    gl_Position.zw = vec2(1, 1);" +
		"    gl_Position.xy = aPosition.xy;" +
		"    vTexCoord = aPosition.zw;" +
		"  }",

	attributes:
		[ "aPosition" ],

	sampler:
		"uImageSampler"
};


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
		"  }",

	attributes:
		[ "aPosition" ],

	uniforms:
		[ "uZ", "uProjectionMatrix", "uModelMatrix" ],

	sampler:
		"uImageSampler"
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
		"  }",

	attributes:
		[ "aPosition", "aTransform", "aTranslate" ],

	uniforms:
		[ "uProjectionMatrix" ],

	sampler:
		"uImageSampler"
};


/**
 * rawBatchImageShaderSources - shaders for batch image drawing
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
		"  }",

	attributes:
		[ "aPosition", "aModelMatrix0", "aModelMatrix1", "aModelMatrix2" ],

	uniforms:
		[ "uProjectionMatrix" ],

	sampler:
		"uImageSampler"
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
		"  attribute vec4 aColor;" +
		"  varying vec4 vColor;" +
		"  void main(void) {" +
		"    vec2 zeroToOne = aPosition / resolution;" +
		"    vec2 zeroToTwo = zeroToOne * 2.0;" +
		"    vec2 clipSpace = zeroToTwo - 1.0;" +
		"    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);" +
		"    vColor = aColor;" +
		"  }",

	attributes:
		[ "aPosition", "aColor" ],

	uniforms:
		[ "resolution" ]
};




function pbShaders()
{
	this.graphicsShaderProgram = null;
	this.imageShaderProgram = null;
	this.blitShaderProgram = null;
	this.batchImageShaderProgram = null;
	this.rawBatchImageShaderProgram = null;
	this.currentProgram = null;
}


pbShaders.prototype.create = function()
{
	// create the shader programs for each drawing mode
	
	// drawing
	this.graphicsShaderProgram = this.createProgram( graphicsShaderSources );

	// individual sprite processing
	this.imageShaderProgram = this.createProgram( imageShaderSources );

	// batch processing
	this.blitShaderProgram = this.createProgram( blitShaderSources );
	this.batchImageShaderProgram = this.createProgram( batchImageShaderSources );
	this.rawBatchImageShaderProgram = this.createProgram( rawBatchImageShaderSources );
};


pbShaders.prototype.destroy = function()
{
	this.graphicsShaderProgram = null;
	this.imageShaderProgram = null;
	this.blitShaderProgram = null;
	this.batchImageShaderProgram = null;
	this.rawBatchImageShaderProgram = null;
	this.currentProgram = null;
};


pbShaders.prototype._getShader = function( sources, typeString )
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


// based on code in http://learningwebgl.com/
pbShaders.prototype.createProgram = function( _source )
{
	console.log( "pbShaders.createProgram" );

	// create a new shader program
	var program = gl.createProgram();

	// get the fragment shader and attach it to the program
	var fragmentShader = this._getShader( _source, "fragment" );
	gl.attachShader( program, fragmentShader );

	// get the vertex shader and attach it to the program
	var vertexShader = this._getShader( _source, "vertex" );
	gl.attachShader( program, vertexShader );

	// link the attached shaders to the program
	gl.linkProgram( program );
	if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) )
	{
		alert( "Could not create shader program: ", gl.getProgramInfoLog( program ) );
		console.log( "pbShaders.createProgram ERROR: ", gl.getProgramInfoLog( program ), "\n", _source );
		gl.deleteProgram( program );
		program = null;
		return null;
	}

	// add the parameter lists from the shader source object
	program.attributes = _source.attributes;
	program.uniforms = _source.uniforms;
	program.sampler = _source.sampler;

	return program;
};


pbShaders.prototype.setProgram = function(_program)
{
	if (this.currentProgram != _program)
	{
		// remove the old program
		this.clearProgram();
		
		//console.log("pbShaders.setProgram", _program);
		
		// set the new program
		this.currentProgram = _program;
		gl.useProgram( this.currentProgram );

		// establish links to attributes and enable them
		if (this.currentProgram.attributes)
		{
			for(var a in this.currentProgram.attributes)
			{
				if (this.currentProgram.attributes.hasOwnProperty(a))
				{
					var attribute = this.currentProgram.attributes[a];
					this.currentProgram[attribute] = gl.getAttribLocation( this.currentProgram, attribute );
					gl.enableVertexAttribArray( this.currentProgram[attribute] );
				}
			}
		}

		// establish links to uniforms
		if (this.currentProgram.uniforms)
		{
			for(var u in this.currentProgram.uniforms)
			{
				if (this.currentProgram.uniforms.hasOwnProperty(u))
				{
					var uniform = this.currentProgram.uniforms[u];
					this.currentProgram[uniform] = gl.getUniformLocation( this.currentProgram, uniform );
				}
			}
		}

		// establish link to the texture sampler
		if (this.currentProgram.sampler)
		{
			this.currentProgram.samplerUniform = gl.getUniformLocation( this.currentProgram, this.currentProgram.sampler );
		   	gl.uniform1i( this.currentProgram.samplerUniform, 0 );
		}
	}
};


/**
 * http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
 *
 * TODO: I'm really not sure if it's relevant as I'm not hot-swapping shaders yet...
 */
pbShaders.prototype.clearProgram = function()
{
	switch(this.currentProgram)
	{
		case this.graphicsShaderProgram:
			this.clearGraphicsProgram();
			break;
		case this.imageShaderProgram:
			this.clearImageProgram();
			break;
		case this.blitShaderProgram:
			this.clearBlitProgram();
			break;
		case this.batchImageShaderProgram:
			this.clearBatchImageProgram();
			break;
		case this.rawBatchImageShaderProgram:
			this.clearRawBatchImageProgram();
			break;
	}
	this.currentProgram = null;
};


pbShaders.prototype.clearGraphicsProgram = function()
{
	//console.log( "pbShaders.clearGraphicsProgram" );

	var program = this.graphicsShaderProgram;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
	program.color = gl.getAttribLocation( program, "color" );
	gl.disableVertexAttribArray( program.color );
};


/*
pbShaders.prototype.setImageProgram = function()
{
	// console.log( "pbShaders.setImageProgram" );

	this.clearProgram();
	
	var program = this.imageShaderProgram;

	gl.useProgram( program );

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.enableVertexAttribArray( program.aPosition );

	program.samplerUniform = gl.getUniformLocation( program, "uImageSampler" );
	program.matrixUniform = gl.getUniformLocation( program, "uModelMatrix" );
	program.projectionUniform = gl.getUniformLocation( program, "uProjectionMatrix" );
	program.uZ = gl.getUniformLocation( program, "uZ" );

	return program;
};
*/

pbShaders.prototype.clearImageProgram = function()
{
	//console.log( "pbShaders.clearImageProgram" );

	var program = this.imageShaderProgram;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
};

/*
pbShaders.prototype.setBlitProgram = function()
{
	this.clearProgram();
	
	var program = this.blitShaderProgram;

	gl.useProgram( program );

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.enableVertexAttribArray( program.aPosition );

	return program;
};
*/

pbShaders.prototype.clearBlitProgram = function()
{
	//console.log( "pbShaders.clearBlitProgram" );

	var program = this.blitShaderProgram;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
};

/*
pbShaders.prototype.setBatchImageProgram = function()
{
	// console.log( "pbShaders.setBatchImageProgram" );

	this.clearProgram();
	
	var program = this.batchImageShaderProgram;

	gl.useProgram( program );

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.enableVertexAttribArray( program.aPosition );
	program.aTransform = gl.getAttribLocation( program, "aTransform" );
	gl.enableVertexAttribArray( program.aTransform );
	program.aTranslate = gl.getAttribLocation( program, "aTranslate" );
	gl.enableVertexAttribArray( program.aTranslate );

	program.samplerUniform = gl.getUniformLocation( program, "uImageSampler" );
	program.projectionUniform = gl.getUniformLocation( program, "uProjectionMatrix" );

	return program;
};
*/

pbShaders.prototype.clearBatchImageProgram = function()
{
	//console.log( "pbShaders.clearBatchImageProgram" );

	var program = this.batchImageShaderProgram;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
	program.aTransform = gl.getAttribLocation( program, "aTransform" );
	gl.disableVertexAttribArray( program.aTransform );
};

/*
pbShaders.prototype.setRawBatchImageProgram = function()
{
	// console.log( "pbShaders.setRawBatchImageProgram" );

	this.clearProgram();
	
	var program = this.rawBatchImageShaderProgram;
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
	program.uZ = gl.getUniformLocation( program, "uZ" );

	return program;
};
*/

pbShaders.prototype.clearRawBatchImageProgram = function()
{
	//console.log( "pbShaders.clearRawBatchImageProgram" );

	var program = this.rawBatchImageShaderProgram;

	program.aPosition = gl.getAttribLocation( program, "aPosition" );
	gl.disableVertexAttribArray( program.aPosition );
	program.aModelMatrix0 = gl.getAttribLocation( program, "aModelMatrix0" );
	gl.disableVertexAttribArray( program.aModelMatrix0 );
	program.aModelMatrix1 = gl.getAttribLocation( program, "aModelMatrix1" );
	gl.disableVertexAttribArray( program.aModelMatrix1 );
	program.aModelMatrix2 = gl.getAttribLocation( program, "aModelMatrix2" );
	gl.disableVertexAttribArray( program.aModelMatrix2 );
};

