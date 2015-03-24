/**
 *
 * pbWebGlFilters.js - data and support code for webGl filters
 *
 * TODO: merge with pbWebGlShaders if it's possible to combine them without affecting the efficiency of either
 * 
 */


var tintFilterSources = {
	// tint the image using a separate multiplication factor for each of r,g and b
	fragment:
		" precision mediump float;" +
		" varying vec2 v_texcoord;" +
		" uniform sampler2D uImageSampler;" +
		" uniform float uRedScale;" +
		" uniform float uGreenScale;" +
		" uniform float uBlueScale;" +
		" void main() {" +
		"   vec4 col = texture2D(uImageSampler, v_texcoord);" +
    	"   gl_FragColor = vec4(col.r * uRedScale, col.g * uGreenScale, col.b * uBlueScale, 1);" +
		" }",

	vertex:
    	" attribute vec4 aPosition;" +
    	" varying vec2 v_texcoord;" +
		" void main() {" +
		"   gl_Position = aPosition;" +
		"   v_texcoord = aPosition.xy * 0.5 + 0.5;" +
		" }",

	attributes:
		[ "aPosition" ],

	uniforms:
		[ "uRedScale", "uGreenScale", "uBlueScale" ],

	sampler:
		"uImageSampler"
};



function pbWebGlFilters()
{
	// TODO: change this into a list
	this.tintFilterProgram = null;
}


// TODO: add a 'register' method which is called to add only the filter programs we're going to actually use for a given demo
pbWebGlFilters.prototype.create = function()
{
	// create the filter programs
	
	this.tintFilterProgram = this.createProgram( tintFilterSources );
};


// TODO: use the list of registered filters
pbWebGlFilters.prototype.destroy = function()
{
	this.clearProgram();
	this.tintFilterProgram = null;
};


pbWebGlFilters.prototype._getFilter = function( sources, typeString )
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
			alert( "Unrecognised filter program type: " + typeString );
			return null;
	}

	// create the correct shader type
	var filter = gl.createShader( type );

	// provide the shader source
	var source = sources[ typeString ];
	gl.shaderSource( filter, source );

	// compile the filter (and check for errors)
	gl.compileShader( filter );
	var status = gl.getShaderParameter( filter, gl.COMPILE_STATUS );
	if ( !status )
	{
		alert( "Filter compile error: " + gl.getShaderInfoLog( filter ) + "\n(" + typeString + ")" );
		gl.deleteShader( filter );
		return null;
	}

	return filter;
};


// based on code from http://learningwebgl.com/
pbWebGlFilters.prototype.createProgram = function( _source )
{
	console.log( "pbWebGlFilters.createProgram" );

	// create a new shader program
	var program = gl.createProgram();

	// get the fragment shader and attach it to the program
	var fragmentShader = this._getFilter( _source, "fragment" );
	gl.attachShader( program, fragmentShader );

	// get the vertex shader and attach it to the program
	var vertexShader = this._getFilter( _source, "vertex" );
	gl.attachShader( program, vertexShader );

	// link the attached shaders to the program
	gl.linkProgram( program );
	if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) )
	{
		alert( "Could not create shader program: ", gl.getProgramInfoLog( program ) );
		console.log( "pbWebGlFilters.createProgram ERROR: ", gl.getProgramInfoLog( program ), "\n", _source );
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


pbWebGlFilters.prototype.setProgram = function(_program)
{
	if (pbWebGlShaders.currentProgram != _program)
	{
		// remove the old program
		this.clearProgram();
		
		//console.log("pbWebGlFilters.setProgram", _program);
		
		// set the new program
		pbWebGlShaders.currentProgram = _program;
		gl.useProgram( pbWebGlShaders.currentProgram );

		// establish links to attributes and enable them
		if (pbWebGlShaders.currentProgram.attributes)
		{
			for(var a in pbWebGlShaders.currentProgram.attributes)
			{
				if (pbWebGlShaders.currentProgram.attributes.hasOwnProperty(a))
				{
					var attribute = pbWebGlShaders.currentProgram.attributes[a];
					pbWebGlShaders.currentProgram[attribute] = gl.getAttribLocation( pbWebGlShaders.currentProgram, attribute );
					if (pbWebGlShaders.currentProgram[attribute] === null)
						console.log("WARNING (pbWebGlFilters.setProgram): filter attribute returned NULL for", attribute, "it's probably unused in the filter");
					else
						gl.enableVertexAttribArray( pbWebGlShaders.currentProgram[attribute] );
				}
			}
		}

		// establish links to uniforms
		if (pbWebGlShaders.currentProgram.uniforms)
		{
			for(var u in pbWebGlShaders.currentProgram.uniforms)
			{
				if (pbWebGlShaders.currentProgram.uniforms.hasOwnProperty(u))
				{
					var uniform = pbWebGlShaders.currentProgram.uniforms[u];
					pbWebGlShaders.currentProgram[uniform] = gl.getUniformLocation( pbWebGlShaders.currentProgram, uniform );
					if (pbWebGlShaders.currentProgram[uniform] === null)
						console.log("WARNING (pbWebGlFilters.setProgram): filter uniform returned NULL for", uniform, "it's probably unused in the filter");
				}
			}
		}

		// establish link to the texture sampler
		if (pbWebGlShaders.currentProgram.sampler)
		{
			pbWebGlShaders.currentProgram.samplerUniform = gl.getUniformLocation( pbWebGlShaders.currentProgram, pbWebGlShaders.currentProgram.sampler );
			// set the fragment shader sampler to use TEXTURE0
		   	gl.uniform1i( pbWebGlShaders.currentProgram.samplerUniform, 0 );
		}
	}
};


/**
 * 
 * http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
 *
 */
pbWebGlFilters.prototype.clearProgram = function()
{
	if (pbWebGlShaders.currentProgram)
	{
		// break links to all attributes and disable them
		if (pbWebGlShaders.currentProgram.attributes)
		{
			for(var a in pbWebGlShaders.currentProgram.attributes)
			{
				if (pbWebGlShaders.currentProgram.attributes.hasOwnProperty(a))
				{
					var attribute = pbWebGlShaders.currentProgram.attributes[a];
					gl.disableVertexAttribArray( pbWebGlShaders.currentProgram[attribute] );
				}
			}
		}

		pbWebGlShaders.currentProgram = null;
	}
};

