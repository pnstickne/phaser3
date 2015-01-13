/**
 *
 * pbMatrix3 - general matrix stuff, plus some specific functions to help out with rendering
 *
 */



function pbMatrix3()
{
}


pbMatrix3.makeTranslation = function( tx, ty )
{
	return [
		     1,  0,  0,
		     0,  1,  0,
		    tx, ty,  1
	];
};


pbMatrix3.makeRotation = function( angleInRadians )
{
	var c = Math.cos( angleInRadians );
	var s = Math.sin( angleInRadians );
	return [
		     c, -s,  0,
		     s,  c,  0,
		     0,  0,  1
	];
};


pbMatrix3.makeScale = function( sx, sy )
{
	return [
		    sx,  0,  0,
		     0, sy,  0,
		     0,  0,  1
	];
};


pbMatrix3.makeTransform = function(_x, _y, _angleInRadians, _scaleX, _scaleY)
{
	var c = Math.cos( _angleInRadians );
	var s = Math.sin( _angleInRadians );

	return [
		c * _scaleX, -s * _scaleY, 0,
		s * _scaleX, c * _scaleY, 0,
		_x, _y, 1
	];
};


pbMatrix3.setTransform = function( _m, _x, _y, _angleInRadians, _scaleX, _scaleY)
{
	var c = Math.cos( _angleInRadians );
	var s = Math.sin( _angleInRadians );

	_m[0] = c * _scaleX;
	_m[1] = -s * _scaleY;
	_m[2] = 0;
	_m[3 + 0] = s * _scaleX;
	_m[3 + 1] = c * _scaleY;
	_m[3 + 2] = 0;
	_m[2 * 3 + 0] = _x;
	_m[2 * 3 + 1] = _y;
	_m[2 * 3 + 2] = 1;
};


pbMatrix3.makeProjection = function(width, height)
{
	// project coordinates into a 2x2 number range, starting at (-1, 1)
	return [
		    2 / width, 0, 0,
		    0, -2 / height, 0,
		    -1, 1, 1
	];
};


pbMatrix3.makeIdentity = function()
{
	return [
		     1,  0,  0,
		     0,  1,  0,
		     0,  0,  1
	];
};


pbMatrix3.matrixMultiply = function( a, b )
{
	var a00 = a[         0 ];
	var a01 = a[         1 ];
	var a02 = a[         2 ];
	var a10 = a[     3 + 0 ];
	var a11 = a[     3 + 1 ];
	var a12 = a[     3 + 2 ];
	var a20 = a[ 2 * 3 + 0 ];
	var a21 = a[ 2 * 3 + 1 ];
	var a22 = a[ 2 * 3 + 2 ];
	var b00 = b[         0 ];
	var b01 = b[         1 ];
	var b02 = b[         2 ];
	var b10 = b[     3 + 0 ];
	var b11 = b[     3 + 1 ];
	var b12 = b[     3 + 2 ];
	var b20 = b[ 2 * 3 + 0 ];
	var b21 = b[ 2 * 3 + 1 ];
	var b22 = b[ 2 * 3 + 2 ];
	return [
			a00 * b00 + a01 * b10 + a02 * b20,
			a00 * b01 + a01 * b11 + a02 * b21,
			a00 * b02 + a01 * b12 + a02 * b22,
			a10 * b00 + a11 * b10 + a12 * b20,
			a10 * b01 + a11 * b11 + a12 * b21,
			a10 * b02 + a11 * b12 + a12 * b22,
			a20 * b00 + a21 * b10 + a22 * b20,
			a20 * b01 + a21 * b11 + a22 * b21,
			a20 * b02 + a21 * b12 + a22 * b22
	];
};


// display transforms always have the form:
// a, b, 0
// c, d, 0
// e, f, 1
// 
// we can speed up the multiplication by skipping the 0 and 1 multiplication steps
pbMatrix3.fastMultiply = function( a, b )
{
	var a00 = a[         0 ];
	var a01 = a[         1 ];
	var a10 = a[     3 + 0 ];
	var a11 = a[     3 + 1 ];
	var a20 = a[ 2 * 3 + 0 ];
	var a21 = a[ 2 * 3 + 1 ];
	var b00 = b[         0 ];
	var b01 = b[         1 ];
	var b10 = b[     3 + 0 ];
	var b11 = b[     3 + 1 ];
	var b20 = b[ 2 * 3 + 0 ];
	var b21 = b[ 2 * 3 + 1 ];
	return [
			a00 * b00 + a01 * b10            ,
			a00 * b01 + a01 * b11            ,
			                                0,
			a10 * b00 + a11 * b10 			 ,
			a10 * b01 + a11 * b11            ,
			                                0,
			a20 * b00 + a21 * b10 +       b20,
			a20 * b01 + a21 * b11 +       b21,
			                                1
	];
};


// display transforms always have the form:
// a, b, 0
// c, d, 0
// e, f, 1
// 
// we can speed up the multiplication by skipping the 0 and 1 multiplication steps
pbMatrix3.setFastMultiply = function( m, a, b )
{
	var a00 = a[         0 ];
	var a01 = a[         1 ];
	var a10 = a[     3 + 0 ];
	var a11 = a[     3 + 1 ];
	var a20 = a[ 2 * 3 + 0 ];
	var a21 = a[ 2 * 3 + 1 ];
	var b00 = b[         0 ];
	var b01 = b[         1 ];
	var b10 = b[     3 + 0 ];
	var b11 = b[     3 + 1 ];
	var b20 = b[ 2 * 3 + 0 ];
	var b21 = b[ 2 * 3 + 1 ];
	m[0] = a00 * b00 + a01 * b10;
	m[1] = a00 * b01 + a01 * b11;
	m[2] = 0;
	m[3 + 0] = a10 * b00 + a11 * b10;
	m[3 + 1] = a10 * b01 + a11 * b11;
	m[3 + 2] = 0;
	m[2 * 3 + 0] = a20 * b00 + a21 * b10 +       b20;
	m[2 * 3 + 1] = a20 * b01 + a21 * b11 +       b21;
	m[2 * 3 + 2] = 1;
};


