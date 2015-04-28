/**
 * 
 * pbSprite - wrapper to bind pbSurface, pbImage and pbTransformObject together to create a simple to use Sprite object
 * 
 */




function pbSprite(_x, _y, _key, _layer)
{
    // get the texture object from the textures dictionary using 'key'
    this.textureObject = textures.getFirst(_key);
    // set up easy access to the surface
	this.surface = this.textureObject.surface;
	// create an image holder and attach the surface
	this.image = new imageClass();
	this.image.create(this.surface);
	// create a transform object for the image
	this.transform = new pbTransformObject();
	this.transform.create(this.image, _x, _y);

	// if a layer is specified, add the new object as a child of it
	if (_layer !== undefined && _layer !== null)
		_layer.addChild(this.transform);
}


Object.defineProperties(pbSprite.prototype, {

    x: {
        get: function () {
            return this.transform.x;
        },
        set: function (value) {
            this.transform.x = value;
        }
    },

    y: {
        get: function () {
            return this.transform.y;
        },
        set: function (value) {
            this.transform.y = value;
        }
    },

    z: {
        get: function () {
            return this.transform.z;
        },
        set: function (value) {
            this.transform.z = value;
        }
    },

    anchorX: {
        get: function () {
            return this.image.anchorX;
        },
        set: function (value) {
            this.image.anchorX = value;
        }
    },

    anchorY: {
        get: function () {
            return this.image.anchorY;
        },
        set: function (value) {
            this.image.anchorY = value;
        }
    },

    fullScreen: {
    	get: function() {
    		return this.image.fullScreen;
    	},
    	set: function(value) {
    		this.image.fullScreen = value;
    	}
    },

    tiling: {
    	get: function() {
    		return this.image.tiling;
    	},
    	set: function(value) {
    		this.image.tiling = value;
    	}
    }
});

