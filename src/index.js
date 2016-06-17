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
     .map(function (fragment) {
      return PARSE_FLOW.reduce(function (_query, parser) {
        return parser(_query, params, fragment, query)
      }, fragment)
  }).map(function (unit) {
    var body = unit;
    if (unit[0] == ".") {
      body = "response." + unit.substr(1)
    }
    return "then(function (response) { return " + body + " })"
  }).join(".")

  console.log(promisedUnits)
  try {
    return new Function("promise", "return Promise.resolve(promise)." + promisedUnits)
  } catch (e) {
    throw new e.constructor("Problem with running pq: " + e.message)
  }
}

function addCustomParser(fn, toEnd) {
  if (toEnd === true) {
    PARSE_FLOW.push(fn)
  } else {
    PARSE_FLOW.unshift(fn)
  }
  return pq
}

function pq(promise, query) {
  var params = Array.prototype.slice.call(arguments, 2)
  if (typeof promise === "string") {
    params.unshift(query)
    query = promise
  }
  return compile.apply(null, [query].concat(params))(promise)
}

pq.compile = compile
pq.parse = addCustomParser

module.exports = pq
