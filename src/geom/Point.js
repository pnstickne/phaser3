export default class Point {

    constructor (x, y) {
        this.x = x;
        this.y = y;
    }

    add (point) {
        this.x += point.x;
        this.y += point.y;
        return this;
    }

    sub (point) {
        this.x -= point.x;
        this.y -= point.y;
        return this;
    }

    toString() {
        return `(x: ${this.x}, y: ${this.y})`;
    }
    
}