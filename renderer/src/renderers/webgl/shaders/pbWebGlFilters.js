/**
 *
 * pbWebGlFilters.js - data and support code for webGl filters
 *
 * TODO: merge with pbWebGlShaders if it's possible to combine them without affecting the efficiency of either
 * 
 */

var multiLightBgSources = {
// for all pixels on screen
//   if pixel is not blocked by wall in the walls texture
//     for all light sources
//       scan from the pixel to each light source
//       if any scan location is blocked by wall abort scan immediately
//       else accumulate colour based on the light source and distance
//     end for
//     set pixel to the floor texture pixel multiplied by the accumulated light colour
//   else
//     we're in a wall, so set the pixel from the walls texture
// end for
	fragment:
		" precision highp float;\n" +
		" " +
		" #define MAX_LIGHTS 16\n" +
		" #define STEPS 64.0\n" +
		" #define AMBIENT_LIGHT vec4(0.0, 0.0, 0.0, 1.0)\n" +
		" " +
		" varying mediump vec2 v_texcoord;\n" +
		" uniform sampler2D uImageSampler;\n" +
		" uniform sampler2D uFloorSampler;\n" +
		" uniform vec4 uLights[MAX_LIGHTS];\n" +
		" " +
		" vec3 unpack(float val)\n" +
		" {\n" +
		"   vec3 col;\n" +
		"   col.b = floor(val / 256. / 256.);\n" +
		"   col.g = floor((val - col.b * 256. * 256.) / 256.);\n" +
		"   col.r = floor(val - col.b * 256. * 256. - col.g * 256.);\n" +
		"   return col / 16.;\n" +
		" }\n" +
		" " +
		" bool blocked(vec2 p)\n" +
		" {	\n" +
		"   return ( texture2D(uImageSampler, p).rgb != vec3(0.0, 0.0, 0.0) );\n" +
		" }\n" +
		" " +
		" vec4 getColor(vec2 p)\n" +
		" {	\n" +
		"   vec4 col = texture2D(uImageSampler, p);\n" +
		"   if ( col.rgb != vec3(0.0, 0.0, 0.0) )\n" +
		"     return col;\n" +
		"   return texture2D(uFloorSampler, p);\n" +
		"// return AMBIENT_LIGHT;\n" +
		" }\n" +
		" " +
		" vec4 getLight(vec2 p, vec2 lp, float power, float range)\n" +
		" {\n" +
		"   float d = distance(lp, p) / range;\n" +
		"   if (d >= 1.0)\n" +
		"     return vec4(0.);\n" +
		"   vec2 sp = p;\n" +
		"   vec2 step = (lp - p) / STEPS;\n" +
		"   // 800 == screen width: convert 0->1.0 coordinates into pixels\n" +
		"   for(float i = 0.0; i < 1.0; i += 1.0 / STEPS)\n" +
		"   {\n" +
		"     if ( blocked(sp) )\n" +
		"       return vec4(0.);\n" +
		"     sp += step;\n" +
		"   }\n" +
		"   //float id = 1. - d;\n" +
		"   vec4 pow = vec4(unpack(power), 0.0);\n" +
		"   float od = d * 3. + .3;\n" +
		"   return pow * (.09 / (od * od));\n" +
		" }\n" +
		" " +
		" vec4 getLighting(vec2 p)\n" +
		" {\n" +
		"   vec4 light = vec4(0.);\n" +
		"   for(int i = 0; i < MAX_LIGHTS; i++)\n" +
		"   {\n" +
		"     vec4 data = uLights[i];\n" +
		"     if (data.z > 0.)\n" +
		"       light += getLight(p, data.xy, data.z, data.w);\n" +
		"   }\n" +
		"   return light + AMBIENT_LIGHT;\n" +
		" }\n" +
		" " +
		" " +
		" void main() {\n" +
		"   if ( blocked(v_texcoord.xy) )\n" +
		"     gl_FragColor = texture2D(uImageSampler, v_texcoord.xy);\n" +
		"   else\n" +
		"     gl_FragColor = getColor(v_texcoord.xy) + getLighting(v_texcoord.xy);\n" +
		" }" ,

	vertex:
    	" attribute vec4 aPosition;\n" +
    	" varying vec2 v_texcoord;\n" +
		" void main() {\n" +
		"   gl_Position = aPosition;\n" +
		"   v_texcoord = aPosition.xy * 0.5 + 0.5;\n" +
		" }",

	attributes:
		[ "aPosition" ],

	uniforms:
		[ "uLights" ],

	samplers:
		[ "uImageSampler", "uFloorSampler" ]
};


var multiLightSources = {
	fragment:
		" precision highp float;\n" +
		" " +
		" #define MAX_LIGHTS 16\n" +
		" #define STEPS 64.0\n" +
		" #define AMBIENT_LIGHT vec4(0.0, 0.01, 0.00, 1.0)\n" +
		" " +
		" varying mediump vec2 v_texcoord;\n" +
		" uniform sampler2D uImageSampler;\n" +
		" uniform vec4 uLights[MAX_LIGHTS];\n" +
		" " +
		" vec3 unpack(float val)\n" +
		" {\n" +
		"   vec3 col;\n" +
		"   col.b = floor(val / 256. / 256.);\n" +
		"   col.g = floor((val - col.b * 256. * 256.) / 256.);\n" +
		"   col.r = floor(val - col.b * 256. * 256. - col.g * 256.);\n" +
		"   return col / 16.;\n" +
		" }\n" +
		" " +
		" bool blocked(vec2 p)\n" +
		" {	\n" +
		"   return ( texture2D(uImageSampler, p).rgb != vec3(0.0, 0.0, 0.0) );\n" +
		" }\n" +
		" " +
		" vec4 getColor(vec2 p)\n" +
		" {	\n" +
		"   vec4 col = texture2D(uImageSampler, p);\n" +
		"   if ( col.rgb != vec3(0.0, 0.0, 0.0) )\n" +
		"     return col;\n" +
		"   return AMBIENT_LIGHT;\n" +
		" }\n" +
		" " +
		" vec4 getLight(vec2 p, vec2 lp, float power, float range)\n" +
		" {\n" +
		"   float d = distance(lp, p) / range;\n" +
		"   if (d >= 1.0)\n" +
		"     return vec4(0.);\n" +
		"   vec2 sp = p;\n" +
		"   vec2 step = (lp - p) / STEPS;\n" +
		"   // 800 == screen width: convert 0->1.0 coordinates into pixels\n" +
		"   for(float i = 0.0; i < 1.0; i += 1.0 / STEPS)\n" +
		"   {\n" +
		"     if ( blocked(sp) )\n" +
		"       return vec4(0.);\n" +
		"     sp += step;\n" +
		"   }\n" +
		"   float id = 1.0 - d;\n" +
		"   vec4 pow = vec4(unpack(power), 0.0);\n" +
		"   return pow * id * id;\n" +
		" }\n" +
		" " +
		" vec4 getLighting(vec2 p)\n" +
		" {\n" +
		"   vec4 light = vec4(0.);\n" +
		"   for(int i = 0; i < MAX_LIGHTS; i++)\n" +
		"   {\n" +
		"     vec4 data = uLights[i];\n" +
		"     if (data.z > 0.)\n" +
		"       light += getLight(p, data.xy, data.z, data.w);\n" +
		"   }\n" +
		"   return light + AMBIENT_LIGHT;\n" +
		" }\n" +
		" " +
		" " +
		" void main() {\n" +
		"   if ( blocked(v_texcoord.xy) )\n" +
		"     gl_FragColor = texture2D(uImageSampler, v_texcoord.xy);\n" +
		"   else\n" +
		"     gl_FragColor = getColor(v_texcoord.xy) + getLighting(v_texcoord.xy);\n" +
		" }" ,

	vertex:
    	" attribute vec4 aPosition;\n" +
    	" varying vec2 v_texcoord;\n" +
		" void main() {\n" +
		"   gl_Position = aPosition;\n" +
		"   v_texcoord = aPosition.xy * 0.5 + 0.5;\n" +
		" }",

	attributes:
		[ "aPosition" ],

	uniforms:
		[ "uLights" ],

	samplers:
		[ "uImageSampler" ]
};

/**
 * lightingShader
 * 
 */

// based on code by Olivier de Schaetzen (citiral), posted on www.shadertoy.com
var pointLightSources = {
	fragment:
		" precision lowp float;\n" +
		" " +
		" #define STEPS 128\n" +
		" #define STEPS2 64\n" +
		" #define LIGHT_TINT vec3(0.6, 0.6, 0.6)\n" +
		" #define LIGHT_POWER 0.05\n" +
		" #define AMBIENT_LIGHT vec4(0.2, 0.2, 0.5, 1.0)\n" +
		" " +
		" varying mediump vec2 v_texcoord;" +
		" uniform sampler2D uImageSampler;" +
		" uniform float uLightPosX;" +
		" uniform float uLightPosY;" +
		" " +
		" bool blocked(vec2 p)" +
		" {	" +
		"//   return ( texture2D(uImageSampler, p).a > 0.1 );\n" +
		"   return ( texture2D(uImageSampler, p).rgb != vec3(0.0, 0.0, 0.0) );\n" +
		" }" +
		" " +
		" vec4 getColor(vec2 p)" +
		" {	" +
		"   vec4 col = texture2D(uImageSampler, p);" +
		"//   if ( col.a > 0.1 ) {\n" +
		"   if ( col.rgb != vec3(0.0, 0.0, 0.0) ) {\n" +
		"     return col;" +
		"   }" +
		"   return AMBIENT_LIGHT;" +
		" }" +
		" " +
		" vec3 getLighting(vec2 p, vec2 lp)" +
		" {" +
		"   float d = distance(p, lp);" +
		"   if (d * 800.0 >= float(STEPS)) {" +
		"     vec2 sp = p;" +
		"     vec2 v = (lp - p) / float(STEPS);" +
		"     for (int i = 0 ; i < STEPS; i++) {" +
		"       if ( blocked(sp) ) {" +
		"         return vec3(d, d, d) + LIGHT_POWER * LIGHT_TINT / d;" +
		"       }" +
		"       sp += v;" +
		"     }" +
		"     return vec3(1.0, 1.0, 1.0) + LIGHT_POWER * LIGHT_TINT / d;" +
		"   }" +
		"   // distance is less than STEPS, use fewer steps to process faster\n" +
		"   vec2 sp = p;" +
		"   vec2 v = (lp - p) / float(STEPS2);" +
		"   for (int i = 0 ; i < STEPS2; i++) {" +
		"     if ( blocked(sp) ) {" +
		"       return vec3(d, d, d) + LIGHT_POWER * LIGHT_TINT / d;" +
		"     }" +
		"     sp += v;" +
		"   }" +
		"   return vec3(1.0, 1.0, 1.0) + LIGHT_POWER * LIGHT_TINT / d;" +
		" }" +
		" " +
		" void main() {" +
		"   vec2 lp = vec2(uLightPosX, uLightPosY);" +
		"   gl_FragColor = getColor(v_texcoord.xy) * vec4(getLighting(v_texcoord.xy, lp), 1.);" +
		" }" ,

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
		[ "uLightPosX", "uLightPosY" ],

	samplers:
		[ "uImageSampler" ]
};


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

	samplers:
		[ "uImageSampler" ]
};


var waveFilterSources = {
	// bend the image using trig effects
	// NOTE: change clamp(xxx, 0.0, 1.0) to mod(xxx, 1.0) if wrap around at edges is preferred
	fragment:
		" precision mediump float;" +
		" varying vec2 v_texcoord;" +
		" uniform sampler2D uImageSampler;" +
		" uniform float uOffsetX;" +
		" uniform float uOffsetY;" +
		" void main() {" +
		"   float ox = sin((v_texcoord.x + uOffsetX) * 3.1416 * 2.0) * 0.1;" +
		"   float oy = sin((v_texcoord.y + uOffsetY) * 3.1416 * 2.0) * 0.1;" +
		"   vec2 srcCoord = vec2(clamp(v_texcoord.x + ox, 0.0, 1.0), clamp(v_texcoord.y + oy, 0.0, 1.0));" +
		"   gl_FragColor = texture2D(uImageSampler, srcCoord);" +
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
		[ "uOffsetX", "uOffsetY" ],

	samplers:
		[ "uImageSampler" ]
};



function pbWebGlFilters()
{
	// TODO: change this into a list
	this.tintFilterProgram = null;
	this.waveFilterProgram = null;
	this.pointLightShaderProgram = null;
	this.multiLightShaderProgram = null;
}


// TODO: add a 'register' method which is called to add only the filter programs we're going to actually use for a given demo
pbWebGlFilters.prototype.create = function()
{
	// create the filter programs
	
	this.tintFilterProgram = this.createProgram( tintFilterSources );
	this.waveFilterProgram = this.createProgram( waveFilterSources );
	this.pointLightShaderProgram = this.createProgram( pointLightSources );
	this.multiLightShaderProgram = this.createProgram( multiLightSources );
	this.multiLightBgShaderProgram = this.createProgram( multiLightBgSources );
};


// TODO: use the list of registered filters
pbWebGlFilters.prototype.destroy = function()
{
	this.clearProgram();
	this.tintFilterProgram = null;
	this.waveFilterProgram = null;
	this.pointLightShaderProgram = null;
	this.multiLightShaderProgram = null;
	this.multiLightBgShaderProgram = null;
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

	// establish links to attributes, uniforms, and the texture sampler
	if (_source.attributes)
	{
		program.attributes = {};
		for(var a in _source.attributes)
		{
			if (_source.attributes.hasOwnProperty(a))
			{
				var attribute = _source.attributes[a];
				program.attributes[attribute] = gl.getAttribLocation( program, attribute );
				if (program.attributes[attribute] === null)
					console.log("WARNING (pbWebGlFilters.setProgram): filter attribute returned NULL for", attribute, "it's probably unused in the filter");
			}
		}
	}

	// establish links to uniforms
	if (_source.uniforms)
	{
		program.uniforms = {};
		for(var u in _source.uniforms)
		{
			if (_source.uniforms.hasOwnProperty(u))
			{
				var uniform = _source.uniforms[u];
				program.uniforms[uniform] = gl.getUniformLocation( program, uniform );
				if (program.uniforms[uniform] === null)
					console.log("WARNING (pbWebGlFilters.setProgram): filter uniform returned NULL for", uniform, "it's probably unused in the filter");
			}
		}
	}

	// establish link to the texture sampler (source)
	if (_source.samplers)
	{
		program.samplerUniforms = {};
		for(var s in _source.samplers)
		{
			if (_source.samplers.hasOwnProperty(s))
			{
				var sampler = _source.samplers[s];
				program.samplerUniforms[sampler] = gl.getUniformLocation( program, sampler );
				if (program.samplerUniforms[sampler] === null)
					console.log("WARNING (pbWebGlFilters.setProgram): filter sampler returned NULL for", sampler, "it's probably unused in the filter");
			}
		}
	}

//	program.samplerUniform = gl.getUniformLocation( program, _source.sampler );

	return program;
};


pbWebGlFilters.prototype.setProgram = function(_program, _textureNumber)
{
	if (pbWebGlShaders.currentProgram != _program)
	{
		// remove the old program
		this.clearProgram();
		
		//console.log("pbWebGlFilters.setProgram", _program);
		
		// set the new program
		pbWebGlShaders.currentProgram = _program;
		gl.useProgram( pbWebGlShaders.currentProgram );

		// enable all attributes
		if (pbWebGlShaders.currentProgram.attributes)
			for(var a in pbWebGlShaders.currentProgram.attributes)
				if (pbWebGlShaders.currentProgram.attributes.hasOwnProperty(a))
					gl.enableVertexAttribArray( pbWebGlShaders.currentProgram.attributes[a] );

		if (pbWebGlShaders.currentProgram.samplerUniforms && pbWebGlShaders.currentProgram.samplerUniforms.uImageSampler)
			// set the fragment shader sampler to use the correct texture
	   		gl.uniform1i( pbWebGlShaders.currentProgram.samplerUniforms.uImageSampler, _textureNumber );
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
					var value = pbWebGlShaders.currentProgram.attributes[a];
					gl.disableVertexAttribArray( value );
				}
			}
		}

		pbWebGlShaders.currentProgram = null;
	}
};

