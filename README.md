# PQ: Human Readable Promise Chain Query Compiler

Promises are awesome. But when it comes to write promise chains, it becomes kind of hard to write.
PQ solves this issue and allows you to create **human readable promise chains**

[![npm version](https://badge.fury.io/js/pquery.svg)](https://badge.fury.io/js/pquery)
[![Build Status](https://travis-ci.org/f/pq.svg?branch=master)](https://travis-ci.org/f/pq)

- Make your Promises more human-readable.
- Allows to **create your own DSL**.
- Zero-dependency.

> `pq.debug()` gives you a cool debugger to debug your queries

## Install

You can simply use NPM/Bower to download **pq**.

```
# Using NPM
npm install pquery --save

# Using Bower
bower install pquery --save
```

## Overview

**What you write:**
```js
pq("(name, surname) of users of @json of #fetch('/users')").then(...)

// or more functional
pq(fetch("/users"), "(name, surname) of users of @json").then(...)

// or Unix way
pq("#fetch('/users') | @json | users | (name, surname)").then(...)

// or reverse pipeline
pq("(name, surname) <| users <| @json <| #fetch('/users')").then(...)
```

**This is actually what you run:**
```js
fetch("/users").
  then(function (response) {
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

## Why?

I use promises in many cases in my daily work. And **calling a promise chain** is a bit *boring* to write. I used to write `then` keyword *again and again* to create a chain and this drive me crazy, **they seem ugly**.

So, I created **pq** to make this chains **easier to write and easier to read**.

Let's checkout a real-world promise example:
```js
var foo = fetch("/hello")

foo.then(function (response) {
  return response.json()
}).then(function (response) {
  return response.data
}) // this then's may go to the sky, or the hell!
```

This is how to write this using **pq**:
```js
pq(foo, "data of @json")
```

### Queries are Powerful Strings

Since **pq** is just a string, you can create queries anywhere you want and these **may be handy to write your own DSL**. Here is a real-world example:

**Instead of** writing this promise chain:
```js
fastfood().
then(function (response) {
  return response.menus
}).
then(function (response) {
  return response.find({name: 'hamburger'})
}).
then(function (response) {
  return response.items()
}).
then(function (response) {
  return response.map(function (res) {
    return {
      name: res.name,
      price: res.price
    }
  })
}).
then(function (response) {
  $("ul").append($("<li/>").html(`${response.name} ${response.price}`))
})
```

**Just write this**:
```html
<ul data-pq="(name, price) of @items of find({name: 'hamburger'}) of menus">
  {% $data.forEach(function (item) { %}
  <li> {{ item.name }} costs {{ item.price }} </li>
  {% }) %}
</ul>
```

## How to Write Queries

There are few simple rules to write a readable query:

### Promise Chain Keywords

**`then` and `of` are main keywords** to generate promise chains. `foo then bar` is actually `foo.then(function (r) { return r.bar })`. Since they are chained, the left part of chain must have the right of the chain.

**`of` (reverse promise keyword) makes the query more readable. Just like the *SQL*, you define what you want at first.** `bar of foo` is `foo.then(function (r) { return r.bar })`, too.

Keyword | Description | Example
--- | --- | ---
`.. then ` or `.. -> ..` or `|>` or ` | ` | Simple promise chain | `@json then data`, `@json -> data`
`.. of ..` or `.. <- ..` or `<|` | Simple promise chain, reversed | `data of @json`, `data <- @json`

> You can use `of` and `then` together: `full_name of user then last_letter of first_name`.
> This will be run like: `(full_name of user) then (last_letter of first_name)`,
> which is actually `user then full_name then first_name then last_letter`.

> **If it becomes confusing to you, do not use them together**

### Meta Characters (Optional)

Meta characters are optional. But they want to make your query easier to read/write. If you want to call a function, you can just put a `@` character beginning of it. `@json` will be converted to `json()`.

The most useful meta character is `%{number}`. It allows you to pass arguments to the `pq`. `("a of %1", "b")` will be `a of b`.

Character | Description | Example | Equivalent
--- | --- | --- | ---
`@` | Method Calling | `@methodName` | `methodName()`
`%{number}` | Simple Parameters | `pq(promise, "%1 of @json", "hello")` | `pq(promise, "hello of @json")`
`&` | This Object | `&.length of users of @json` | `this.length of users of json()`
`#` | Single Call | `@json of #fetch(...)` |
`!` | Promisify | `response of !functionWithCallback` |

### Tutorial

This is a simple, delayed Promised function:
```js
function sauces(id) {
  return function () {
    return new Promise(function (resolve) {
      return resolve({
        items: id == 1 ? [
          {name: "Ketchup"},
          {name: "Mustard"}
        ] : [
          {name: "BBQ"},
          {name: "Mayonnaise"}
        ]
      })
    })
  }
}

function burgers() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      return resolve({
        items: [
          {name: "McChicken", price: "$10", sauces: sauces(1)},
          {name: "Big Mac", price: "$15", sauces: sauces(2)},
        ]
      })
    }, 1000)
  })
}
```

Let's query this using **pq**:

```js
pq(burgers(), "(price) of items").then(function (prices) {
  console.log(prices) // [{price: "$10", price: "$15"}]
})
```

Let's make it more complex:
```js
pq(burgers(), "(name) of items of @sauces of items[0]").then(function (sauce) {
  console.log(sauce) // [{name: "Ketchup"}, {name: "Mustard"}]
})
```

## How to Write Custom Parsers

It's too easy to add custom parsers using `pq.parse` command:

```js
pq.parse(function (query) {
  return query.replace(/^gh\:([^\s]+)/, "#fetch('https://api.github.com/$1?page=1&per_page=100')")
})

pq.parse(function (query) {
  return query.replace(/([^\s]+)\s*~=\s*([^\s]+)/, "filter(function (n) {return n.$1 == '$2'})")
})
```

Then you'll be able to use your custom parsers.
```js
pq("name~=delorean of @json of gh:users/f/repos").then(function (result) {
  console.log(result)
})
```

## Query Reducers

Query reducers helps you to manage your data flow easier.

### `pq.before`

`pq.before` will give you the raw query so you can make changes on it on-the-fly.

```js
pq.before(function (query) {
  // You can change query before compilation
  return query
})
```

### `pq.after`

`pq.after` will give you compiled promise fragments.

```js
pq.after(function (queries) {
  // You can change queries after it's compiled
  return queries.push(pq.compile_fragment("@json"))
})
```

## License

MIT Licensed - Copyright &copy; 2016 by Fatih Kadir Akın
