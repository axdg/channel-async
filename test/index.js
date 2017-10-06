/**
 * We need to run these tests with async-to-gen to get
 * them working in the latest stable version of electron...
 * which still doesn't have support for the `async / await`
 * syntax.
 */
const expect = require('expect');

const Channel = require('../src/index.js');

describe('Channel', function () {
  describe('existence of all exported methods and properties', function () {
    it('exports a constructor as the default', function () {
      expect(Channel).toBeA(Function);
    });

    it('which contains all required static methods', function () {
      expect(Channel.send).toBeA(Function);
      expect(Channel.receive).toBeA(Function);
      expect(Channel.range).toBeA(Function);
    });

    it('returns a Channel instance', function () {
      const c = new Channel();
      expect(c).toBeAn('object');
    });

    describe('Channel instances', function () {
      it('contains all required methods and properties', function () {
        const c = new Channel();

        // Methods and properties.
        expect(c.queue).toBeA(Function);
        expect(c.size).toBeA('number');
        expect(c.size).toBe(0);
        expect(c.capacity).toBeA('number');
        expect(c.capacity).toBe(1); // NOTE: The default.
        expect(c.open).toBeA('boolean');
        expect(c.open).toBe(true);
      });

      it('has a specific capacity', function () {
        const c = new Channel(16);

        expect(c.capacity).toBe(16);
        expect(c.size).toBe(0);
      });

      it('allows sending until that capacity is reached', async function () {
        // NOTE: This is a super contrived test... could definitely be fixed up.
        const v = 'x';
        const c = new Channel(2);

        expect(c.size).toBe(0);

        await c.queue(v);
        expect(c.size).toBe(1);

        await c.queue(v);
        expect(c.size).toBe(2);

        return new Promise(async function (resolve, reject) {
          try {
            let tick = false;
            c.queue(v).then(() => (tick = !tick)); // eslint-disable-line no-return-assign

            await Promise.resolve().then(function () {
              expect(c.size).toBe(3);

              // Third call hasn't resolved.
              expect(tick).toBeFalsy();
            });

            // Receivcing should resolve the send.
            await c.queue();
            expect(c.size).toBe(2);

            expect(tick).toBeTruthy();
            resolve();
          } catch (err) { reject(err); }
        });
      });

      // TODO: Test recieving.
      it('allows recieving while values are queued', function (done) {
        const c = new Channel()

        // This will not resolve until a send happens.
        const v = c.queue().then(function (x) {
          expect(c.size).toEqual(0)
          expect(x).toEqual('x')
          done()
        }).catch(function (err) { done(err) })

        // This will trigger a receive.
        expect(c.size).toEqual(0)
        c.queue('x')
      });

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
      });

      it('allows closing of a channel', async function () {
        const c = new Channel();

        expect(c.open).toBe(true);

        await c.queue('x');
        expect(c.open).toBe(true);

        await c.queue();
        expect(c.open).toBe(true);

        await c.queue(null);
        expect(c.open).toBe(false);
      });
    });
  });

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
      });
    });

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
          const v = await Channel.receive(c)
        } catch (err) {
          m = err.message
        }

        expect(m).toEqual('x')
      });
    });

    describe('Channel.range', function () {
      it('allows ranging over a channel', async function () {
        const c = new Channel()

        // Let's send some values into the channel.
        let count = 0
        while (count < 5) Channel.send(c, count++)

        // We have to close the channel.
        Channel.close(c)

        let d = []

        // Range over the channel.
        try {
          await Channel.range(c, function (v) {
            return d.push(v)
          })
        } catch (err) {
          throw err
        }

        expect(d).toEqual([0, 1, 2, 3, 4])
      });

      it('allows for a return value from range', async function () {
        const c = new Channel()

        /**
         * Let's send some values into the channel;
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
          })
        } catch (err) {
          throw err
        }

        expect(d).toEqual([0, 1, 2, 4])
      })
    });
  });
});
