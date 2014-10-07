# good-http

Http(s) broadcasting for Good process monitor

[![Build Status](https://travis-ci.org/hapijs/good-file.svg?branch=master)](https://travis-ci.org/hapijs/good-file) ![Current Version](https://img.shields.io/npm/v/good-http.svg)

Lead Maintainer: [Adam Bretz](https://github.com/arb)

## Usage

`good-http` is a [good-reporter](https://github.com/hapijs/good-reporter) implementation to write [hapi](http://hapijs.com/) server events to remote endpoints. It makes a "POST" request with a JSON payload to the supplied `endpoint`.

## Good Http
### new GoodHttp (endpoint, [options])

creates a new GoodFile object with the following arguments
- `endpoint` - full path to remote server to transmit logs.
- `[options]` - optional arguments object
	- `[events]` - an object of key value paris. Defaults to `{ request: '*', log: '*' }`.
		- `key` - one of ("request", "log", "error", or "ops") indicating the hapi event to subscribe to
		- `value` - an array of tags to filter incoming events. An empty array indicates no filtering.
	- `threshold` - number of events to hold before transmission. Defaults to `20`. Set to `0` to have every event start transmission instantly. It is strongly suggested to have a set threshold to make data transmission more efficient.
    - `[wreck]` - configuration object to pass into [`wreck`](https://github.com/hapijs/wreck#advanced). Defaults to `{ timeout: 60000, headers: {} }`. `content-type` is always "application/json".

### GoodHttp Methods
`good-file` implements the [good-reporter](https://github.com/hapijs/good-reporter) interface as has no additional public methods.

- `stop()` - `GoodHttp` will make a final attempt to transmit anything remaining in it's internal event queue when `stop` is called.

### Schema
Each POST will match the following schema. Every event will be wrapped inside the `events` key and grouped by the event type and ordered by the timestamp. The payload that is POSTed to the `endpoint` has the following schema:

```json
{
  "host":"servername.home",
  "schema":"good-http",
  "timeStamp":1412710565121,
  "events":{
    "request":[
      {
        "event":"request",
        "timestamp":1413464014739,
        ...
      },
      {
        "event":"request",
        "timestamp":1414221317758,
        ...
      },
      {
        "event":"request",
        "timestamp":1415088216608,
        ...
      }
    ],
    "log":[
      {
        "event":"log",
        "timestamp":1415180913160,
        ...
      },
      {
        "event":"log",
        "timestamp":1422493874390,
        ...
      }
    ]
  }
}
```
