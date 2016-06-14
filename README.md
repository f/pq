<img src="https://dl.dropbox.com/s/044jmqzt2ee5bkn/pquery.png" alt="PQ: Human Readable Promise Chains">

Promises are awesome. But when it comes to write promise chains, it becomes kind of hard to write.
PQ solves this issue and allows you to create **human readable promise chains**

[![npm version](https://badge.fury.io/js/pquery.svg)](https://badge.fury.io/js/pquery)

- Make your Promises more human-readable.
- Allows to **create your own DSL**.
- Zero-dependency.

## Install

You can simply use NPM to download **pq**.

```
npm install pquery --save
```

## Overview

**What you write:**
```js
pq(fetch("/users"), "(name, surname) of users of @json").then(...)
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
`.. then ` or `.. -> ..` | Simple promise chain | `@json then data`, `@json -> data`
`.. of ..` or `.. <- ..` | Simple promise chain, reversed | `data of @json`, `data <- @json`

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

## License

MIT Licensed - Copyright &copy; 2016 by Fatih Kadir Akın
