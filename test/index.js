/**
 * We need to run these tests with async-to-gen to get
 * them working in the latest stable version of electron...
 * which still doesn't have support for the `async / await`
 * syntax.
 */
const expect = require('expect')

const Channel = require('../src/index.js')

describe('Channel', function () {
  describe('existence of all exported methods and properties', function () {
    it('exports a constructor as the default', function () {
      expect(Channel).toBeA(Function)
    })

    it('which contains all required static methods', function () {
      expect(Channel.send).toBeA(Function)
      expect(Channel.receive).toBeA(Function)
      expect(Channel.range).toBeA(Function)
    })

    it('returns a Channel instance', function () {
      const c = new Channel()
      expect(c).toBeAn('object')
    })

    describe('Channel instances', function () {
      it('contains all required methods and properties', function () {
        const c = new Channel()

        // Methods and properties.
        expect(c.queue).toBeA(Function)
        expect(c.size).toBeA('number')
        expect(c.size).toBe(0)
        expect(c.capacity).toBeA('number')
        expect(c.capacity).toBe(1) // NOTE: The default.
        expect(c.open).toBeA('boolean')
        expect(c.open).toBe(true)
      })

      it('has a specific capacity', function () {
        const c = new Channel(16)

        expect(c.capacity).toBe(16)
        expect(c.size).toBe(0)
      })

      it('allows sending until that capacity is reached', async function () {
        // NOTE: This is a super contrived test... could definitely be fixed up.
        const v = 'x'
        const c = new Channel(2)

        expect(c.size).toBe(0)

        await c.queue(v)
        expect(c.size).toBe(1)

        await c.queue(v)
        expect(c.size).toBe(2)

        return new Promise(async function (resolve, reject) {
          try {
            let tick = false
            c.queue(v).then(() => (tick = !tick)) // eslint-disable-line no-return-assign

            await Promise.resolve().then(function () {
              expect(c.size).toBe(3)

              // Third call hasn't resolved.
              expect(tick).toBeFalsy()
            })

            // Receivcing should resolve the send.
            await c.queue()
            expect(c.size).toBe(2)

            expect(tick).toBeTruthy()
            resolve()
          } catch (err) { reject(err) }
        })
      })

      // TODO: Test recieving.
      it('allows recieving while values are queued', function (done) {
        const c = new Channel()

        // This will not resolve until a send happens.
        c.queue().then(function (x) {
          expect(c.size).toEqual(0)
          expect(x).toEqual('x')
          done()
        }).catch(function (err) { done(err) })

        // This will trigger a receive.
        expect(c.size).toEqual(0)
        c.queue('x')
      })

      // TODO: Test recieving where a promise was sent as a value.
      // QUESTION: Would an async lock be better?
      it('allows receiving of promises, and awaits it', async function () {
        const c = new Channel(1)

        // Let's queue a promise.
        c.queue(async function () {
          return Promise.resolve('x')
        }())

        try {
          const v = await c.queue()
          expect(v).toEqual('x')
        } catch (err) {
          throw err
        }
      })

      it('allows closing of a channel', async function () {
        const c = new Channel()

        expect(c.open).toBe(true)

        await c.queue('x')
        expect(c.open).toBe(true)

        await c.queue()
        expect(c.open).toBe(true)

        await c.queue(null)
        expect(c.open).toBe(false)
      })
    })
  })

  // TODO: Pending tests...
  describe('sending, recieve and range constructor methods', function () {
    describe('Channel.send', function () {
      it('allows sending', async function () {
        const c = new Channel()

        // Put a promise into the channel.
        Channel.send(c, (async () => 'x')())

        try {
          // Receive a value from the channel.
          const v = await Channel.receive(c)
          expect(v).toEqual('x')
        } catch (err) {
          throw err
        }
      })
    })

    describe('Channel.recieve', function () {
      /**
       * Pretty much identical to the test above... just working out some kinks.
       */
      it('allows receiving', async function () {
        const c = new Channel()

        // Let's send a rejecting promise.
        Channel.send(c, (async function () {
          throw new Error('x')
        }()))

        let m
        try {
          // And here we'll catch the error it throws.
          await Channel.receive(c)
        } catch (err) {
          m = err.message
        }

        expect(m).toEqual('x')
      })
    })

    describe('Channel.range', function () {
      it('allows ranging over a channel', async function () {
        const c = new Channel()

        // Let's send some values into the channel.
        let count = 0
        while (count < 5) Channel.send(c, count++)

        // We have to close the channel.
        Channel.close(c)

        const d = []

        // Range over the channel.
        try {
          await Channel.range(c, function (v) {
            return d.push(v)
          })
        } catch (err) {
          throw err
        }

        expect(d).toEqual([0, 1, 2, 3, 4])
      })

      it('allows for a return value from range', async function () {
        const c = new Channel()

        /**
         * Let's send some values into the channel
         * In this instance they'll be promises.
         */

        let count = 0
        while (count < 5) Channel.send(c, new Promise(r => r(count++)))

        // We have to close the channel.
        Channel.close(c)

        let d

        // Range over the channel.
        try {
          d = await Channel.range(c, function (v) {
            if (v !== 3) return v
            return undefined // ESLint made me.
          })
        } catch (err) {
          throw err
        }

        expect(d).toEqual([0, 1, 2, 4])
        return undefined // ESLint made me.
      })
    })
  })
})

const readFile = function (path, data) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      return resolve(data)
    }, Math.floor(Math.random() * 4))
  })
}

const writeFile = function (path) {
  return readFile(path, undefined)
}

describe('a basic, intended usage - takes a while', function () {
  it('handles high concurrency and syncronization', async function () {
    /**
     * We reasonable need to adjust some values
     * for this tests.
     */
    this.timeout(50 * 1000)
    this.slow(40000)

    const a = new Array(10000).fill(0).map(function (_, i) {
      return i.toString()
    })

    const c = new Channel(64)

    const reader = async function () {
      try {
        let v
        while (v = a.shift()) { // eslint-disable-line no-cond-assign
          await Channel.send(c, readFile(`../some/path/${v}.txt`, v))
        }
      } catch (err) {
        throw err
      }

      await Channel.close(c)
    }

    reader() // Kick this puppy off.

    const d = await Channel.range(c, async function (v) {
      await writeFile(`../some/other/path/${v}.txt`)
      return parseInt(v, 10)
    })

    d.forEach(function (v, i) {
      expect(v).toEqual(i)
    })
  })

  it('can be used to block at capacity', async function () {
    const c = new Channel(4)

    const sender = async function () {
      const a = new Array(6).fill(0)
      try {
        let v = a.pop()
        while (v === 0) {
          await Channel.send(c, v)
          v = a.pop()
        }
      } catch (err) {
        throw err
      }
    }

    const size = function () {
      return new Promise(function (resolve) {
        setTimeout(async function () {
          try {
            expect(c.size).toEqual(5)
            resolve()
          } catch (err) {
            throw err
          }
        }, 32)
      })
    }

    sender()

    // Since sending is blocked... size can never change.
    await size()
    await size()
  })
})

