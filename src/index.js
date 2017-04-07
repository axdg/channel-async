/* eslint-disable no-constant-condition, no-await-in-loop, no-multi-assign */
module.exports = module.exports.default = function (capacity = 1) {
  /**
   * TODO: The value that is passed into the channel
   * as a capacity actually needs to be type checked,
   * it needs to be a positive integer (defaulting
   * to one).
   */

  const queue = []
  const inbound = []
  const outbound = []

  let closed = false

  const fn = function (value) {
    if (value !== undefined) {
      return new Promise((resolve, reject) => {
        if (closed === true) {
          return reject()
        }

        if (value === null) {
          closed = true
        }

        if (queue.length === capacity) {
          return inbound.push(() => {
            queue.push(value)
            if (outbound.length > 0) {
              outbound.shift()()
            }

            return resolve()
          })
        }

        queue.push(value)
        if (outbound.length > 0) {
          outbound.shift()()
        }

        return resolve()
      })
    }

    return new Promise(resolve => {
      if (queue.length === 0) {
        if (closed) {
          return resolve(null)
        }

        return outbound.push(() => {
          if (inbound.length > 0) {
            inbound.shift()()
          }

          return resolve(queue.shift())
        })
      }

      if (inbound.length > 0) {
        inbound.shift()()
      }

      return resolve(queue.shift())
    })
  }

  Object.defineProperty(fn, 'size', {get() {
    return queue.length
  }})

  Object.defineProperty(fn, 'open', {get() {
    return !closed
  }})

  fn.close = function () {
    return fn(null)
  }

  return fn
}

module.exports.range = function (chan, fn) {
  return new Promise((resolve, reject) => {
    (async function () {
      try {
        while (true) {
          const value = await chan()
          if (value === null) {
            resolve()
            return
          }

          fn(value)
        }
      } catch (err) {
        reject(err)
      }
    })()
  })
}

module.exports.send = function (chan, value) {
  return chan(value)
}

module.exports.receive = function (chan) {
  return chan()
}

module.exports.close = function (chan) {
  return chan(null)
}
