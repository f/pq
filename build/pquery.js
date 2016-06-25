(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.pq = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var processFn = function (fn, P, opts) {
	return function () {
		var that = this;
		var args = new Array(arguments.length);

		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
		}

		return new P(function (resolve, reject) {
			args.push(function (err, result) {
				if (err) {
					reject(err);
				} else if (opts.multiArgs) {
					var results = new Array(arguments.length - 1);

					for (var i = 1; i < arguments.length; i++) {
						results[i - 1] = arguments[i];
					}

					resolve(results);
				} else {
					resolve(result);
				}
			});

			fn.apply(that, args);
		});
	};
};

var pify = module.exports = function (obj, P, opts) {
	if (typeof P !== 'function') {
		opts = P;
		P = Promise;
	}

	opts = opts || {};
	opts.exclude = opts.exclude || [/.+Sync$/];

	var filter = function (key) {
		var match = function (pattern) {
			return typeof pattern === 'string' ? key === pattern : pattern.test(key);
		};

		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	var ret = typeof obj === 'function' ? function () {
		if (opts.excludeMain) {
			return obj.apply(this, arguments);
		}

		return processFn(obj, P, opts).apply(this, arguments);
	} : {};

	return Object.keys(obj).reduce(function (ret, key) {
		var x = obj[key];

		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, P, opts) : x;

		return ret;
	}, ret);
};

pify.all = pify;

},{}],2:[function(require,module,exports){
module.exports = function (pq) {
  return function () {
    pq.before(function (query) {
      console.group("%cPQ: " + query, "\
                      padding: 2px 5px;\
                      font-weight: normal;\
                      background-color:#222;\
                      display: inline-block;\
                      border-radius:3px;\
                      font-size:16px;\
                      color:#fff;\
                      ")
        /*
        */
      return query
    })
    pq.after(function (query) {
      console.group('Promise Chain')
      query.forEach(function (q) {
        console.log(q
                    .replace(/^then\(function \(response\) \{ return/, ' ... ')
                    .replace(/\}\)$/, ' ... '))
      })
      console.groupEnd()
      return query
    })
    pq.middleware(function (r) {
      if (typeof r === "string" || typeof r === "number") {
        console.log(r)
      } else if (r instanceof Array) {
        r.forEach(i => console.log(i))
      } else {
        for (var key in r) {
          if (r.hasOwnProperty(key)) {
            console.log(`${key}:`, r[key])
          }
        }
      }
      console.groupEnd()
      return r
    })
  }
}

},{}],3:[function(require,module,exports){
var PARSE_FLOW = require("./parsers")
var AFTER_FLOW = []
var BEFORE_FLOW = []
var RESPONSE_FLOW = []
var ERROR_FLOW = []

var REVERSE_PROMISE_SEPERATOR = /\sof\s|\<\-|\<\|/g
var PROMISE_SEPERATOR = /\sthen\s|\-\>|\|\>|\s\|\s/g

function flatten(array) {
  return array.reduce(function (a, b) {
    return a.concat(b)
  }, [])
}

function addCustomParser(fn, toEnd) {
  if (toEnd === true) {
    PARSE_FLOW.push(fn)
  } else {
    PARSE_FLOW.unshift(fn)
  }
  return pq
}

function addBeforeHandler(fn) {
  BEFORE_FLOW.push(fn)
  return pq
}

function addAfterHandler(fn) {
  AFTER_FLOW.push(fn)
  return pq
}

function addResponseHandler(fn) {
  RESPONSE_FLOW.push(fn)
  return pq
}

function compileFragments(fragments, params, query) {
  return fragments.map(function (fragment) {
      return PARSE_FLOW.reduce(function (_query, parser) {
        return parser(_query, params, fragment, query)
      }, fragment)
  }).map(function (unit) {
    var body = "response." + unit
    if (unit[0] == "#") {
      body = unit.substr(1)
    }
    return "then(function (response) { return " + body + " })"
  })
}

function orderQuery(query) {
  var promises = query.split(PROMISE_SEPERATOR)
  return flatten(promises.map(function (sub) {
    return sub.split(REVERSE_PROMISE_SEPERATOR).reverse()
  })).map(function (query) {
    return query.trim()
  })
}

function compile(query) {
  var params = Array.prototype.slice.call(arguments, 1)
  query = BEFORE_FLOW.reduce(function (query, handler) {
    return handler(query, params)
  }, query)
  var promisedUnits = compileFragments(orderQuery(query), params, query)

  promisedUnits = AFTER_FLOW.reduce(function (query, handler) {
    return handler(query, params)
  }, promisedUnits).join(".")

  try {
    return new Function("promise", "return Promise.resolve(promise)." + promisedUnits)
  } catch (e) {
    throw new e.constructor("Problem with running pq: " + e.message)
  }
}

function pq(promise, query) {
  var params = Array.prototype.slice.call(arguments, 2)
  if (typeof promise === "string") {
    params.unshift(query)
    query = promise
  }
  return compile.apply(null, [query].concat(params))(promise).then(function (response) {
    return RESPONSE_FLOW.reduce(function (response, handler) {
      return handler(response)
    }, response)
  })
}

pq.promisify = require('pify')
pq.compile = compile
pq.compileFragments = compileFragments
pq.orderQuery = orderQuery
pq.parse = addCustomParser
pq.before = addBeforeHandler
pq.after = addAfterHandler
pq.middleware = addResponseHandler
pq.debug = require('./debugger')(pq)
module.exports = pq

Promise.prototype.query = function (query) {
  return this.then(function (response) {
    return pq(response, query)
  })
}

},{"./debugger":2,"./parsers":4,"pify":1}],4:[function(require,module,exports){
function parseEachKey(query) {
  var KEY_GETTER = /^\(([\w+\,\s\.]+)\)$/gi
  if (KEY_GETTER.test(query)) {
    var keys = query.replace(KEY_GETTER, function (m, keys) {
      return keys.split(",").map(function (key) {
        return key.trim()
      }).map(function (key) {
        return key.split('.').pop() + ": o." + key
      }).join(", ")
    })
    return ".map(function (o) { return { " + keys + " }})"
  }
  return query
}

function parseParam(query, params) {
  return query.replace(/(^\s*|[^\%])\%(\d+)/g, function (_, e, r) {
    return (e=='%'?'':e) + params[parseInt(r)-1]
  }).replace(/\%{2}(\d+)/g, "%$1")
}

function parseThis(query) {
  return query
    .replace(/^\&\./g, "response.")
    .replace(/^this$/g, "response")
}

function parseMethodCall(query) {
  return query.replace(/^\@([\w\.\_]+)/g, "$1()")
}

function parsePify(query) {
  return query.replace(/^\!([\w\.\_]+)(.*)/, "#pq.promisify($1)$2")
}

// Parser Flow
module.exports = [
  parseEachKey,
  parseThis,
  parseMethodCall,
  parseParam,
  parsePify
]

},{}]},{},[3])(3)
});