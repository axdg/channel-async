/**
 * The channel constructor function, takes a
 * single argument - the capacity.
 *
 * @param {Number}
 *
 * @returns {Object}
 */
function Channel(capacity = 1) {
  const queued = [];
  const inbound = [];
  const outbound = [];

  let closed = false;

  // Type check the arguments.
  if (typeof capacity !== 'number' || capacity < 1) {
    throw new Error('capacity must be a non-zero positive integer');
  }

  this.queue = function (value) {
    if (value !== undefined) {
      return new Promise(function (resolve, reject) {
        // The channel is closed... sending is not possible.
        if (closed === true) {
          return reject(new Error('attempt to send to a closed channel'));
        }

        // The channel should be closed.
        if (value === null) {
          closed = true;
          return resolve();
        }

        // The internal buffer is at capacity.
        if (queued.length === capacity) {
          return inbound.push(function () {
            queued.push(value);
            if (outbound.length > 0) {
              outbound.shift()();
            }

            return resolve(value);
          });
        }

        return queued.push(function () {
          if (outbound.length > 0) {
            outbound.shift()();
          }

          return resolve(value);
        });
      });
    }

    return
  };
}
