/**
 *
 * pbMatrix4 - general 3D matrix stuff (homogenous, so 4x4)
 *
 */




/*
The following three code lines are from the gl-matrix project:

Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */
if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}


// TODO: rotation direction may vary between WebGL:
// 		"    vec3 pos = uProjectionMatrix * modelMatrix * vec3(aPosition.xy, 1);" +
//		"    gl_Position = vec4(pos.xy, z, 1);"
// and Canvas:
//		this.ctx.transform(a, b, c, d, e, f);
// because the WebGL is upside-down.  Finding a different way to compensate for that might remove rotationDirection.
pbMatrix4.rotationDirection = -1;			// default is correct for Canvas mode, +1 for webGl, I cannot believe the standards differ!


function pbMatrix4()
{
}


pbMatrix4.makeTranslation = function( tx, ty )
{
	var m = new GLMAT_ARRAY_TYPE(16);
	m[0] = 1;
	m[1] = 0;
	m[2] = 0;
	m[3] = 0;

	m[4] = 0;
	m[5] = 1;
	m[6] = 0;
	m[7] = 0;

	m[8] = 0;
	m[9] = 0;
	m[10] = 1;
	m[11] = 0;

	m[12] = tx;
	m[13] = ty;
	m[14] = 0;
	m[15] = 1;
	return m;
};


pbMatrix4.makeRotation = function( angleInRadians )
{
	var c = Math.cos( angleInRadians );
	var s = Math.sin( angleInRadians ) * pbMatrix4.rotationDirection;
	var m = new GLMAT_ARRAY_TYPE(16);
	m[0] = c;
	m[1] = -s;
	m[2] = 0;
	m[3] = 0;

	m[4] = s;
	m[5] = c;
	m[6] = 0;
	m[7] = 0;

	m[8] = 0;
	m[9] = 0;
	m[10] = 1;
	m[11] = 0;

	m[12] = 0;
	m[13] = 0;
	m[14] = 0;
	m[15] = 1;
	return m;
};


pbMatrix4.makeScale = function( sx, sy )
{
	var m = new GLMAT_ARRAY_TYPE(16);
	m[0] = sx;
	m[1] = 0;
	m[2] = 0;
	m[3] = 0;

	m[4] = 0;
	m[5] = sy;
	m[6] = 0;
	m[7] = 0;

	m[8] = 0;
	m[9] = 0;
	m[10] = 1;
	m[11] = 0;

	m[12] = 0;
	m[13] = 0;
	m[14] = 0;
	m[15] = 1;

	return m;
};


pbMatrix4.makeTransform = function(_x, _y, _angleInRadians, _scaleX, _scaleY)
{
	var c = Math.cos( _angleInRadians );
	var s = Math.sin( _angleInRadians ) * pbMatrix4.rotationDirection;
	var m = new GLMAT_ARRAY_TYPE(16);

	m[0] = c * _scaleX;
	m[1] = -s * _scaleY;
	m[2] = 0;
	m[3] = 0;

	m[4] = s * _scaleX;
	m[5] = c * _scaleY;
	m[6] = 0;
	m[7] = 0;

	m[8] = 0;
	m[9] = 0;
	m[10] = 1;
	m[11] = 0;

	m[12] = _x;
	m[13] = _y;
	m[14] = 0;
	m[15] = 1;

	return m;
};


pbMatrix4.setTransform = function( _m, _x, _y, _angleInRadians, _scaleX, _scaleY)
{
	var c = Math.cos( _angleInRadians );
	var s = Math.sin( _angleInRadians ) * pbMatrix4.rotationDirection;

	_m[0] = c * _scaleX;
	_m[1] = -s * _scaleY;
	_m[2] = 0;
	_m[3] = 0;

	_m[4] = s * _scaleX;
	_m[5] = c * _scaleY;
	_m[6] = 0;
	_m[7] = 0;

	_m[8] = 0;
	_m[9] = 0;
	_m[10] = 1;
	_m[11] = 0;

	_m[12] = _x;
	_m[13] = _y;
	_m[14] = 0;
	_m[15] = 1;
};


pbMatrix4.makeProjection = function(width, height)
{
	// project coordinates into a 2x2 number range, starting at (-1, 1)
	var m = new GLMAT_ARRAY_TYPE(16);
	m[0] = 2 / width;
	m[1] = 0;
	m[2] = 0;
	m[3] = 0;

	m[4] = 0;
	m[5] = -2 / height;
	m[6] = 0;
	m[7] = 0;

	m[8] = 0;
	m[9] = 0;
	m[10] = 1;
	m[11] = 0;

	m[12] = -1;
	m[13] = 1;
	m[14] = 1;
	m[15] = 1;

	return m;
};


pbMatrix4.makeIdentity = function()
{
	var m = new GLMAT_ARRAY_TYPE(16);
	m[0] = 1;
	m[1] = 0;
	m[2] = 0;
	m[3] = 0;

	m[4] = 0;
	m[5] = 1;
	m[6] = 0;
	m[7] = 0;

	m[8] = 0;
	m[9] = 0;
	m[10] = 1;
	m[11] = 0;

	m[12] = 0;
	m[13] = 0;
	m[14] = 0;
	m[15] = 1;

	return m;
};


pbMatrix4.matrixMultiply = function( a, b )
{
	var a00 = a[         0 ];
	var a01 = a[         1 ];
	var a02 = a[         2 ];
	var a03 = a[         3 ];
	var a10 = a[     4 + 0 ];
	var a11 = a[     4 + 1 ];
	var a12 = a[     4 + 2 ];
	var a13 = a[     4 + 3 ];
	var a20 = a[ 2 * 4 + 0 ];
	var a21 = a[ 2 * 4 + 1 ];
	var a22 = a[ 2 * 4 + 2 ];
	var a23 = a[ 2 * 4 + 3 ];
	var a30 = a[ 3 * 4 + 0 ];
	var a31 = a[ 3 * 4 + 1 ];
	var a32 = a[ 3 * 4 + 2 ];
	var a33 = a[ 3 * 4 + 3 ];
	var b00 = b[         0 ];
	var b01 = b[         1 ];
	var b02 = b[         2 ];
	var b03 = b[         3 ];
	var b10 = b[     4 + 0 ];
	var b11 = b[     4 + 1 ];
	var b12 = b[     4 + 2 ];
	var b13 = b[     4 + 3 ];
	var b20 = b[ 2 * 4 + 0 ];
	var b21 = b[ 2 * 4 + 1 ];
	var b22 = b[ 2 * 4 + 2 ];
	var b23 = b[ 2 * 4 + 3 ];
	var b30 = b[ 3 * 4 + 0 ];
	var b31 = b[ 3 * 4 + 1 ];
	var b32 = b[ 3 * 4 + 2 ];
	var b33 = b[ 3 * 4 + 3 ];
	var m = new GLMAT_ARRAY_TYPE(16);
	m[0]  = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
	m[1]  = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
	m[2]  = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
	m[3]  = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;

	m[4]  = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
	m[5]  = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
	m[6]  = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
	m[7]  = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;

	m[8]  = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
	m[9]  = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
	m[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
	m[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;

	m[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
	m[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
	m[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
	m[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
	return m;
};


// display transforms always have the form:
// a, b, c, 0
// d, e, f, 0
// g, h, i, 0
// j, k, l, 1
// 
// we can speed up the multiplication by skipping the 0 and 1 multiplication steps
pbMatrix4.fastMultiply = function( a, b )
{
	var a00 = a[         0 ];
	var a01 = a[         1 ];
	var a02 = a[         2 ];

	var a10 = a[     4 + 0 ];
	var a11 = a[     4 + 1 ];
	var a12 = a[     4 + 2 ];

	var a20 = a[ 2 * 4 + 0 ];
	var a21 = a[ 2 * 4 + 1 ];
	var a22 = a[ 2 * 4 + 2 ];

	var a30 = a[ 3 * 4 + 0 ];
	var a31 = a[ 3 * 4 + 1 ];
	var a32 = a[ 3 * 4 + 2 ];

	var b00 = b[         0 ];
	var b01 = b[         1 ];
	var b02 = b[         2 ];

	var b10 = b[     4 + 0 ];
	var b11 = b[     4 + 1 ];
	var b12 = b[     4 + 2 ];

	var b20 = b[ 2 * 4 + 0 ];
	var b21 = b[ 2 * 4 + 1 ];
	var b22 = b[ 2 * 4 + 2 ];

	var b30 = b[ 3 * 4 + 0 ];
	var b31 = b[ 3 * 4 + 1 ];
	var b32 = b[ 3 * 4 + 2 ];

	var m = new GLMAT_ARRAY_TYPE(16);
	m[0]  = a00 * b00 + a01 * b10 + a02 * b20;
	m[1]  = a00 * b01 + a01 * b11 + a02 * b21;
	m[2]  = a00 * b02 + a01 * b12 + a02 * b22;
	m[3]  =                         a02      ;

	m[4]  = a10 * b00 + a11 * b10 + a12 * b20;
	m[5]  = a10 * b01 + a11 * b11 + a12 * b21;
	m[6]  = a10 * b02 + a11 * b12 + a12 * b22;
	m[7]  =                         a12      ;

	m[8]  = a20 * b00 + a21 * b10 + a22 * b20;
	m[9]  = a20 * b01 + a21 * b11 + a22 * b21;
	m[10] = a20 * b02 + a21 * b12 + a22 * b22;
	m[11] =                         a22      ;

	m[12] = a30 * b00 + a31 * b10 + a32 * b20 +       b30;
	m[13] = a30 * b01 + a31 * b11 + a32 * b21 +       b31;
	m[14] = a30 * b02 + a31 * b12 + a32 * b22 +       b32;
	m[15] = 1;
	return m;
};


// display transforms always have the form:
// a, b, c, 0
// d, e, f, 0
// g, h, i, 0
// j, k, l, 1
// 
// we can speed up the multiplication by skipping the 0 and 1 multiplication steps
pbMatrix4.setFastMultiply = function( a, b )
{
	var a00 = a[         0 ];
	var a01 = a[         1 ];
	var a02 = a[         2 ];

	var a10 = a[     4 + 0 ];
	var a11 = a[     4 + 1 ];
	var a12 = a[     4 + 2 ];

	var a20 = a[ 2 * 4 + 0 ];
	var a21 = a[ 2 * 4 + 1 ];
	var a22 = a[ 2 * 4 + 2 ];

	var a30 = a[ 3 * 4 + 0 ];
	var a31 = a[ 3 * 4 + 1 ];
	var a32 = a[ 3 * 4 + 2 ];

	var b00 = b[         0 ];
	var b01 = b[         1 ];
	var b02 = b[         2 ];

	var b10 = b[     4 + 0 ];
	var b11 = b[     4 + 1 ];
	var b12 = b[     4 + 2 ];

	var b20 = b[ 2 * 4 + 0 ];
	var b21 = b[ 2 * 4 + 1 ];
	var b22 = b[ 2 * 4 + 2 ];

	var b30 = b[ 3 * 4 + 0 ];
	var b31 = b[ 3 * 4 + 1 ];
	var b32 = b[ 3 * 4 + 2 ];

	a[0]  = a00 * b00 + a01 * b10 + a02 * b20;
	a[1]  = a00 * b01 + a01 * b11 + a02 * b21;
	a[2]  = a00 * b02 + a01 * b12 + a02 * b22;
	a[3]  =                         a02      ;

	a[4]  = a10 * b00 + a11 * b10 + a12 * b20;
	a[5]  = a10 * b01 + a11 * b11 + a12 * b21;
	a[6]  = a10 * b02 + a11 * b12 + a12 * b22;
	a[7]  =                         a12      ;

	a[8]  = a20 * b00 + a21 * b10 + a22 * b20;
	a[9]  = a20 * b01 + a21 * b11 + a22 * b21;
	a[10] = a20 * b02 + a21 * b12 + a22 * b22;
	a[11] =                         a22      ;

	a[12] = a30 * b00 + a31 * b10 + a32 * b20 +       b30;
	a[13] = a30 * b01 + a31 * b11 + a32 * b21 +       b31;
	a[14] = a30 * b02 + a31 * b12 + a32 * b22 +       b32;
	a[15] = 1;
};


