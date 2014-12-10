


var desiredFps = 60;


function pbRootTimer()
{
    this.time = undefined;
    this.lastTime = undefined;
    this.elapsedTime = undefined;
    this.frameCount = 0;

    this._updateCallback = null;
    this._updateContext = null;

    var vendors = [
        'ms',
        'moz',
        'webkit',
        'o'
    ];

    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++)
    {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'];
    }
}


pbRootTimer.prototype.start = function(_updateCallback, _updateContext)
{
    this._updateCallback = _updateCallback;
    this._updateContext = _updateContext;

    if (performance && performance.now)
        this._getTime = function() { return performance.now(); };
    else
        this._getTime = Date.now || this.getTime;

    this.time = this.lastTime = this._getTime();
    this.elapsedTime = 0;

    var _this = this;
    if (!window.requestAnimationFrame)
    {
        this._onLoop = function () {
                return _this._updateSetTimeout();
            };
        window.setTimeout(this._onLoop, 0);
    }
    else
    {
        this._onLoop = function () {
                return _this._updateRAF();
            };
        window.requestAnimationFrame(this._onLoop);
    }
};


/**
 * The update method using requestAnimationFrame
 */
pbRootTimer.prototype._updateRAF = function()
{
    this._timer(this._getTime());

    window.requestAnimationFrame(this._onLoop);
    this._updateCallback.call(this._updateContext);
};


/**
 * The update method using setTimeout
 */
pbRootTimer.prototype._updateSetTimeout = function ()
{
    this._timer(this._getTime());

    window.setTimeout(this._onLoop, 1000 / desiredFps);
    this._updateCallback.call(this._updateContext);
};


pbRootTimer.prototype._timer = function(_time)
{
    this.frameCount++;
    this.time = _time;
    this.elapsedTime = this.time - this.lastTime;
    this.lastTime = this.time;
};


pbRootTimer.prototype.getTime = function()
{
    return (new Date).getTime();
};

