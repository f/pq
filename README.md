# PQ: Human Readable Promise Chains

Promises are awesome. But when it comes to write promise chains, it becomes kind of hard to write.
PQ solves this issue and allows you to create **human readable promise chains**

**What you write:**
```js
var query = "(name, surname) of users of @json"

pq(fetch("/users"), query).then(...)
```

**This is actually what you run:**
```js
fetch("/users").
  then(function () {
    return response.json()
  }).
  then(function (response) {
    return response.users
  }).
  then(function (response) {
    return response.map(function (object) { return {
      name: object.name,
      surname: object.surname
  }})
})
```

## Install

```
npm install pquery --save
```

## Overview

Let's checkout a real-world promise example:
```js
var foo = fetch("/hello")

foo.then(function (response) {
  return response.json()
}).then(function (response) {
  return response.data
})
```

This is how to write this using **pq**:
```js
pq(foo, "data of @json")
```

Alternatively, you can write this more human-readable:

```js
pq(foo, "data of @json")

// Or using `then`
pq(foo, "@json then data")

// Or using arrows...
pq(foo, "@json -> data")

// Also reversed arrows:
pq(foo, "data <- @json")
```

## How to Write Queries

There are few simple rules to write a readable query:

Character | Description | Example | Equivalent
--- | --- | --- | ---
`@` | Method Calling | `@methodName` | `methodName()`
`%{number}` | Simple Parameters | `pq(promise, "%1 of @json", "hello")` | `pq(promise, "hello of @json")`
`&` | This Object | `&.length of users of @json` | `this.length of users of json()`

Keyword | Description | Example
--- | --- | ---
`.. then ` or `.. -> ..` | Simple promise chain | `@json then data`, `@json -> data`
`.. of ..` or `.. <- ..` | Simple promise chain, reversed | `data of @json`, `data <- @json`

## License

MIT Licensed - Copyright &copy; 2016 by Fatih Kadir Akın
