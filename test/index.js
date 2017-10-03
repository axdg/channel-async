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
      it('allows recieving while values are queued');

      // TODO: Test recieving where a promise was sent as a value.
      // QUESTION: Would an async lock be better?
      it('allows receiving of promises');

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
      it('allows sending');
    });

    describe('Channel.recieve', function () {
      it('allows reciving');
    });

    describe('Channel.range', function () {
      it('allows ranging over a channel');
    });
  });
});
