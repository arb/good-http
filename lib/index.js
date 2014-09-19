// Load modules

var GoodReporter = require('good-reporter');
var Os = require('os');
var Wreck = require('wreck');
var Hoek = require('hoek');

// Declare internals

var internals = {
    defaults: {
        threshold: 20,
        timeout: 60000,
        schema: 'good-http',
        headers: {},
        wreck: {}
    },
    host: Os.hostname()
};


internals.createEventMap = function (eventQueue) {

    var eventTypes = ['error', 'ops', 'request', 'log'];
    var result = {};

    eventTypes.forEach(function (event) {

        var filter = eventQueue.filter(function (item) {
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


internals.sendMessage = function (callback) {

    var envelope = {
        host: internals.host,
        schema: this._settings.schema,
        timeStamp: Date.now()
    };

    envelope.events = internals.createEventMap(this._eventQueue);

    var wreckOptions = {
        payload: JSON.stringify(envelope)
    };

    Hoek.merge(wreckOptions, this._settings.wreck, false);

    // Prevent this from user tampering
    wreckOptions['content-type'] = 'application/json';

    this._eventQueue.length = 0;

    Wreck.request('post', this._settings.endpoint, wreckOptions, callback);
};


module.exports = internals.GoodHttp = function (options) {

    Hoek.assert(this.constructor === internals.GoodHttp, 'GoodHttp must be created with new');
    Hoek.assert(options.endpoint, 'endpoint must be specified');

    var settings = Hoek.clone(options);
    settings = Hoek.applyToDefaults(internals.defaults, settings);

    settings.wreck.timeout = settings.timeout;
    settings.wreck.headers = settings.headers;

    delete settings.timeout;
    delete settings.headers;

    GoodReporter.call(this, settings);
};


Hoek.inherits(internals.GoodHttp, GoodReporter);


GoodReporter.prototype.report = function (callback) {


    // If we've hit the threshold, then we want to report
    if (this._eventQueue.length >= this._settings.threshold) {

        internals.sendMessage.apply(this, arguments);
    }
    else {
        process.nextTick(function() {

            return callback(null);
        });
    }
};


GoodReporter.prototype.stop = function (callback) {

    internals.sendMessage.apply(this, arguments);
};