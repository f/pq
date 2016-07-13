module.exports = function (pq) {
  return function () {
    pq.before(function (query) {
      for (var i = 0; i < 50; i++) { console.groupEnd() }
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
        r.forEach(function (i) { console.log(i) })
      } else {
        for (var key in r) {
          if (r.hasOwnProperty(key)) {
            console.log(key + ":", r[key])
          }
        }
      }
      console.groupEnd()
      return r
    })
  }
}
