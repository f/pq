var PARSE_FLOW = require("./parsers")

var REVERSE_PROMISE_SEPERATOR = /\sof\s|\<\-/g
var PROMISE_SEPERATOR = /\sthen\s|\-\>/g

function flatten(array) {
  return array.reduce(function (a, b) {
    return a.concat(b)
  }, [])
}

function pq(promise, query) {
  var params = Array.prototype.slice.call(arguments, 2)
  var promises = query.split(PROMISE_SEPERATOR)
  var promisedUnits = flatten(promises.map(function (sub) {
    return sub.split(REVERSE_PROMISE_SEPERATOR).reverse()
  })).map(function (query) { return query.trim() })
     .map(function (query) {
      return PARSE_FLOW.reduce(function (_query, parser) {
        return parser(_query, params)
      }, query)
  }).map(function (unit) {
    return "\n  then(function (response) {\n    return response." + unit + "\n  })"
  }).join(".")

  try {
    var func = new Function("promise", "  return Promise.resolve(promise)." + promisedUnits)
    console.log(func.toString())
    return func(promise)
  } catch (e) {
    throw new e.constructor("Problem with running pq: " + e.message)
  }
}

module.exports = pq
