// Load modules

var Os = require('os');
var GoodReporter = require('good-reporter');
var Hoek = require('hoek');
var Stringify = require('json-stringify-safe');
var Wreck = require('wreck');

// Declare internals

var internals = {
    defaults: {
        threshold: 20,
        schema: 'good-http',
        wreck: {
            timeout: 60000,
            headers: {}
        }
    },
    host: Os.hostname()
};


internals.createEventMap = function (events) {

    var eventTypes = ['error', 'ops', 'request', 'log'];
    var result = {};

    eventTypes.forEach(function (event) {

        var filter = events.filter(function (item) {
            return item.event === event;
        });

        // Sort the events oldest > newest
        filter.sort(function (a, b) {

            return a.timestamp - b.timestamp;
        });

        if (filter.length) {
            result[event] = filter;
        }
    });

    return result;
};


module.exports = internals.GoodHttp = function (endpoint, options) {

    Hoek.assert(this.constructor === internals.GoodHttp, 'GoodHttp must be created with new');
    Hoek.assert(typeof endpoint === 'string', 'endpoint must be a string');

    var settings = Hoek.clone(options);
    settings = Hoek.applyToDefaults(internals.defaults, settings);
    settings.endpoint = endpoint;

    GoodReporter.call(this, settings);
};


Hoek.inherits(internals.GoodHttp, GoodReporter);


internals.GoodHttp.prototype.start = function (emitter, callback) {

    emitter.on('report', this._handleEvent.bind(this));
    return callback(null);
};


internals.GoodHttp.prototype.stop = function () {

    this._sendMessages();
};


internals.GoodHttp.prototype._report = function (event, eventData) {

    this._eventQueue.push(eventData);
    if (this._eventQueue.length >= this._settings.threshold) {
        this._sendMessages();
        this._eventQueue.length = 0;
    }
};


internals.GoodHttp.prototype._sendMessages = function () {

    if (!this._eventQueue.length) { return; }

    var envelope = {
        host: internals.host,
        schema: this._settings.schema,
        timeStamp: Date.now()
    };

    envelope.events = internals.createEventMap(this._eventQueue);

    var wreckOptions = {
        payload: Stringify(envelope)
    };

    Hoek.merge(wreckOptions, this._settings.wreck, false);

    // Prevent this from user tampering
    wreckOptions.headers['content-type'] = 'application/json';

    Wreck.request('post', this._settings.endpoint, wreckOptions);
};