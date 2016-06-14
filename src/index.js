var PARSE_FLOW = require("./parsers")

var REVERSE_PROMISE_SEPERATOR = /\sof\s|\<\-/g
var PROMISE_SEPERATOR = /\sthen\s|\-\>/g

function flatten(array) {
  return array.reduce(function (a, b) {
    return a.concat(b)
  }, [])
}

function compile(query) {
  var params = Array.prototype.slice.call(arguments, 1)
  var promises = query.split(PROMISE_SEPERATOR)
  var promisedUnits = flatten(promises.map(function (sub) {
    return sub.split(REVERSE_PROMISE_SEPERATOR).reverse()
  })).map(function (query) { return query.trim() })
     .map(function (query) {
      return PARSE_FLOW.reduce(function (_query, parser) {
        return parser(_query, params)
      }, query)
  }).map(function (unit) {
    return "then(function (r) { r.this = r; return r." + unit + " })"
  }).join(".")

  try {
    return new Function("promise", "return Promise.resolve(promise)." + promisedUnits)
  } catch (e) {
    throw new e.constructor("Problem with running pq: " + e.message)
  }
}

function pq(promise, query) {
  var params = Array.prototype.slice.call(arguments, 2)
  compile.apply(null, [query].concat(params))(promise)
}

pq.compile = compile

module.exports = pq
