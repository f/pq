var assert = require('assert')
var compile = require("../").compile

function getCompiledCode(code, param) {
  return compile(code, param).toString().split(/\n/)[2]
}

assert.equal(getCompiledCode("a of b"), "return Promise.resolve(promise).then(function (response) { return response.b }).then(function (response) { return response.a })")
assert.equal(getCompiledCode("a of b of c"), "return Promise.resolve(promise).then(function (response) { return response.c }).then(function (response) { return response.b }).then(function (response) { return response.a })")
assert.equal(getCompiledCode("b then a"), "return Promise.resolve(promise).then(function (response) { return response.b }).then(function (response) { return response.a })")
assert.equal(getCompiledCode("a of b"), getCompiledCode("a <- b"))
assert.equal(getCompiledCode("a then b"), getCompiledCode("a -> b"))
assert.equal(getCompiledCode("a then b"), getCompiledCode("b of a"))
assert.equal(getCompiledCode("a of b"), getCompiledCode("b then a"))
assert.equal(getCompiledCode("a <- b"), getCompiledCode("b then a"))
assert.equal(getCompiledCode("a of b"), getCompiledCode("b -> a"))
assert.equal(getCompiledCode("a of b of c"), getCompiledCode("c then b then a"))
assert.equal(getCompiledCode("a -> b -> c"), getCompiledCode("c <- b <- a"))

assert.equal(getCompiledCode("a of @b"), "return Promise.resolve(promise).then(function (response) { return response.b() }).then(function (response) { return response.a })")
assert.equal(getCompiledCode("a of @b of c()"), "return Promise.resolve(promise).then(function (response) { return response.c() }).then(function (response) { return response.b() }).then(function (response) { return response.a })")
assert.equal(getCompiledCode("b then @a"), "return Promise.resolve(promise).then(function (response) { return response.b }).then(function (response) { return response.a() })")
assert.equal(getCompiledCode("@a of b"), getCompiledCode("@a <- b"))
assert.equal(getCompiledCode("a then @b"), getCompiledCode("a -> @b"))
assert.equal(getCompiledCode("a then b()"), getCompiledCode("@b of a"))
assert.equal(getCompiledCode("a() of b"), getCompiledCode("b then @a"))
assert.equal(getCompiledCode("a <- @b"), getCompiledCode("b() then a"))
assert.equal(getCompiledCode("@a of b"), getCompiledCode("b -> a()"))
assert.equal(getCompiledCode("@a of @b of @c"), getCompiledCode("c() then b() then a()"))
assert.equal(getCompiledCode("a() -> b() -> c()"), getCompiledCode("@c <- @b <- @a"))

assert.equal(getCompiledCode("a() -> b('%1') -> c()", "hey"), getCompiledCode("@c <- b('hey') <- @a"))
