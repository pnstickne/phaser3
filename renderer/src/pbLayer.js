/**
 *
 * pbLayer - Contains one layer of multiple pbSprite objects.
 *
 * All sprites held in a layer are z-sorted using the pbSprite.z coordinate which uses a webgl shader hack for depth buffering.
 * Sprites held in a layer are therefore eligible for high-speed batch drawing when they share a source surface.
 * 
 * TODO: Layers will inherit from pbSprite to acquire the nested hierarchy and transform inheritance already implemented there.
 * Layers will not have a surface though, so they use pbSprite purely as a logical construct and not as a display object.
 * TODO: Check if 'layers' are even necessary as a unique object, pbSprite might already contain the full requisite functionality!
 * 
 */


