# good-http

Http(s) broadcasting for Good process monitor

[![Build Status](https://travis-ci.org/hapijs/good-file.svg?branch=master)](https://travis-ci.org/hapijs/good-file) ![Current Version](https://img.shields.io/npm/v/good-http.svg)

Lead Maintainer: [Adam Bretz](https://github.com/arb)

## Usage

`good-http` is a [good-reporter](https://github.com/hapijs/good-reporter) implementation to write [hapi](http://hapijs.com/) server events to remote endpoints. It makes a "POST" request with a JSON payload to the supplied `endpoint`.

## Good Http
### new GoodHttp ([options])

creates a new GoodFile object with the following arguments
- `[options]` - optional arguments object
	- `[events]` - an object of key value paris. Defaults to `{ request: [], log: [] }`.
		- `key` - one of ("request", "log", "error", or "ops") indicating the hapi event to subscribe to
		- `value` - an array of tags to filter incoming events. An empty array indicates no filtering.
	- `threshold` - number of events to hold before transmission. Defaults to `20`. Set to `0` to have every event start transmission instantly. It is strongly suggested to have a set threshold to make data transmission more efficient.
	- `endpoint` - full path to remote server to transmit logs.
	- `timeout` - `Wreck` timeout option. Defaults to `60000`.
	- `headers` - additional headers to send during transmission. Defaults to `{}`. "content-type:application/json" is always used.

### GoodHttp Methods
`good-file` implements the [good-reporter](https://github.com/hapijs/good-reporter) interface as has no additional public methods.

- `stop(callback)` - `GoodHttp` will make a final attempt to transmit anything remaining in it's internal event queue when `stop` is called.
