# PQ: Promise Queries

Promises are awesome. But when it comes to write promise chains, it becomes kind of hard to write.

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
pq(foo, "json() -> data")
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

## License

MIT Licensed - Copyright &copy; 2016 by Fatih Kadir Akın
