var PARSE_FLOW = require("./parsers")
var AFTER_FLOW = []
var BEFORE_FLOW = []
var RESPONSE_FLOW = []
var ERROR_FLOW = []

var REVERSE_PROMISE_SEPERATOR = /\sof\s|\<\-/g
var PROMISE_SEPERATOR = /\sthen\s|\-\>/g

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
  var promise = compile.apply(null, [query].concat(params))(promise).then(function (response) {
    return RESPONSE_FLOW.reduce(function (response, handler) {
      return handler(response)
    }, response)
  })

  return {
    promise: promise,
    query: function (query) {
      return pq(promise, query)
    }
  }
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

