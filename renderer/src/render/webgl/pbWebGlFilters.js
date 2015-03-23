/**
 *
 * pbWebGlFilters.js - data and support code for webGl filters
 *
 * TODO: merge with pbWebGlShaders if it's possible to combine them without affecting the efficiency of either
 * 
 */


var testFilterSources = {
	fragment:
		" precision mediump float;" +
		" varying vec2 v_texcoord;" +
		" uniform sampler2D uImageSampler;" +
		" void main() {" +
    	"   gl_FragColor = texture2D(uImageSampler, v_texcoord);" +
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

	sampler:
		"uImageSampler"
};



function pbWebGlFilters()
{
	// TODO: change this into a list
	this.testFilterProgram = null;
	this.currentProgram = null;
}


// TODO: add a 'register' method which is called to add only the filter programs we're going to actually use for a given demo
pbWebGlFilters.prototype.create = function()
{
	// create the filter programs
	
	this.testFilterProgram = this.createProgram( testFilterSources );
};


// TODO: use the list of registered filters
pbWebGlFilters.prototype.destroy = function()
{
	this.clearProgram();
	this.testFilterProgram = null;
	this.currentProgram = null;
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
	if (this.currentProgram != _program)
	{
		// remove the old program
		this.clearProgram();
		
		//console.log("pbWebGlFilters.setProgram", _program);
		
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
					if (this.currentProgram[attribute] === null)
						console.log("WARNING (pbWebGlFilters.setProgram): filter attribute returned NULL for", attribute, "it's probably unused in the filter");
					else
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
					if (this.currentProgram[uniform] === null)
						console.log("WARNING (pbWebGlFilters.setProgram): filter uniform returned NULL for", uniform, "it's probably unused in the filter");
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
 * 
 * http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
 *
 */
pbWebGlFilters.prototype.clearProgram = function()
{
	if (this.currentProgram)
	{
		// break links to all attributes and disable them
		if (this.currentProgram.attributes)
		{
			for(var a in this.currentProgram.attributes)
			{
				if (this.currentProgram.attributes.hasOwnProperty(a))
				{
					var attribute = this.currentProgram.attributes[a];
					gl.disableVertexAttribArray( this.currentProgram[attribute] );
				}
			}
		}

		this.currentProgram = null;
	}
};

