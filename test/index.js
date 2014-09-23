// Load modules

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var GoodHttp = require('..');
var Hapi = require('hapi');
var Async = require('async');

// Declare internals

var internals = {};

internals.isSorted = function (elements) {

    var i = 0;
    var il = elements.length;

    while (i < il && elements[i+1]) {

        if (elements[i].timestamp > elements[i+1].timestamp) {
            return false;
        }
        ++i;
    }
    return true;
};

internals.makeServer = function (handler) {

    var server = new Hapi.Server('127.0.0.1', 0);

    server.route({
        method: 'POST',
        path: '/',
        handler: handler
    });

    return server;
};

// Test shortcuts

var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;

describe('good-http', function() {

    it('throws an error without using new', function(done) {

        expect(function () {

            var reporter = GoodHttp('www.github.com');
        }).to.throw('GoodHttp must be created with new');

        done();
    });

    it('throws an error if missing endpoint', function (done) {

        expect(function () {

            var reporter = new GoodHttp(null);
        }).to.throw('endpoint must be a string');

        done();
    });

    describe('report()', function () {

        it('honors the threshold setting and sends the events in a batch', function (done) {

            var hitCount = 0;
            var server = internals.makeServer(function (request, reply) {

                hitCount++;
                var payload = request.payload;
                var events = payload.events.log;

                expect(request.headers['x-api-key']).to.equal('12345');
                expect(payload.schema).to.equal('good-http');
                expect(events.length).to.equal(5);

                if (hitCount === 1) {
                    expect(events[4].id).to.equal(4);
                    expect(events[4].event).to.equal('log');
                    reply();
                }

                if (hitCount === 2) {
                    expect(events[4].id).to.equal(9);
                    expect(events[4].event).to.equal('log');

                    reply();
                    done();
                }
            });

            server.start(function () {

                var reporter = new GoodHttp(server.info.uri, {
                    threshold: 5,
                    events: {
                        log: '*'
                    }
                }, {
                    headers: {
                        'x-api-key': 12345
                    }
                });

                Async.eachSeries([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], function (item, next) {

                    reporter.queue('log', {
                        event: 'log',
                        timestamp: Date.now(),
                        id: item
                    });
                    reporter.report(function (error) {

                        expect(error).to.not.exist;
                        next();
                    });
                });
            });
        });

        it('sends each event individually if threshold is 0', function (done) {

            var hitCount = 0;
            var server = internals.makeServer(function (request, reply) {

                hitCount++;
                var payload = request.payload;

                expect(payload.events).to.exist;
                expect(payload.events.log).to.exist;
                expect(payload.events.log.length).to.equal(1);
                expect(payload.events.log[0].id).to.equal(hitCount - 1);

                if (hitCount === 10) {
                    done();
                }
                reply();
            });

            server.start(function () {

                var reporter = new GoodHttp(server.info.uri, {
                    threshold: 0,
                    events: {
                        log: '*'
                    }
                });

                Async.eachSeries([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], function (item, next) {

                    reporter.queue('log', {
                        event: 'log',
                        timestamp: Date.now(),
                        id: item
                    });
                    reporter.report(function (error) {

                        expect(error).to.not.exist;
                        next();
                    });
                });
            });
        });

        it('sends the events in an envelop grouped by type and ordered by timestamp', function(done) {

            var hitCount = 0;
            var server = internals.makeServer(function (request, reply) {

                hitCount++;
                var payload = request.payload;
                var events = payload.events;

                expect(request.headers['x-api-key']).to.equal('12345');
                expect(payload.schema).to.equal('good-http');

                expect(events.log).to.exist;
                expect(events.log.length).to.equal(2);

                expect(events.request).to.exist;
                expect(events.request.length).to.equal(3);

                expect(internals.isSorted(events.log)).to.equal(true);
                expect(internals.isSorted(events.request)).to.equal(true);

                reply();

                if (hitCount === 2) {
                    done();
                }
            });

            server.start(function () {

                var reporter = new GoodHttp(server.info.uri, {
                    threshold: 5,
                    events: {
                        log: '*',
                        request: '*'
                    }
                }, {
                    headers: {
                        'x-api-key': 12345
                    }
                });

                Async.eachSeries([1, 3, 5, 2, 4, 7, 9, 11, 6, 8], function (item, next) {

                    var eventType = item % 2 === 0 ? 'log' : 'request';

                    reporter.queue(eventType, {
                        event: eventType,
                        // Create a random timestamp to put them out of order
                        timestamp: Math.floor(Date.now() + (Math.random() * 10000000000)),
                        id: item
                    });
                    reporter.report(function (error) {

                        expect(error).to.not.exist;
                        next();
                    });
                });
            });
        });

        it('handles circular object references correctly', function (done) {

            var hitCount = 0;
            var server = internals.makeServer(function (request, reply) {

                hitCount++;
                var events = request.payload.events;

                expect(events).to.exist;
                expect(events.log).to.exist;
                expect(events.log.length).to.equal(5);
                expect(events.log[0]._data).to.equal('[Circular ~.events.log.0]');


                expect(hitCount).to.equal(1);
                done();
            });

            server.start(function () {

                var reporter = new GoodHttp(server.info.uri, {
                    threshold: 5,
                    events: {
                        log: '*'
                    }
                });

                Async.eachSeries([0, 1, 2, 3, 4], function (item, next) {

                    var data = {
                        event: 'log',
                        timestamp: Date.now(),
                        id: item
                    };

                    data._data = data;

                    reporter.queue('log', data);
                    reporter.report(function (error) {

                        expect(error).to.not.exist;
                        next();
                    });
                });
            });
        });
    });
    describe('stop()', function () {

        it('makes a last attempt to send any remaining log entries', function (done) {

            var hitCount = 0;
            var server = internals.makeServer(function (request, reply) {

                hitCount++;
                var payload = request.payload;
                var events = payload.events;

                expect(events.log).to.exist;
                expect(events.log.length).to.equal(2);

                reply();
            });

            server.start(function () {

                var reporter = new GoodHttp(server.info.uri, {
                    threshold: 3,
                    events: {
                        log: '*'
                    }
                }, {
                    headers: {
                        'x-api-key': 12345
                    }
                });

                reporter.queue('log', {
                    event: 'log',
                    timestamp: Date.now(),
                    id: 1
                });
                reporter.queue('log', {
                    event: 'log',
                    timestamp: Date.now(),
                    id: 2
                });

                reporter.report(function (error) {

                    expect(error).to.not.exist;

                    reporter.stop(function (err) {

                        expect(err).to.not.exist;
                        expect(hitCount).to.equal(1);

                        done();
                    });
                });
            });
        });
    });
});