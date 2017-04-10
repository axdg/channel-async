/**
 * The channel constructor function, takes a
 * single argument - the capacity.
 *
 * @param {Number}
 *
 * @returns {Object}
 */
const Channel = function Channel(capacity = 1) {
  const queued = [];
  const inbound = [];
  const outbound = [];

  let closed = false;

  // Type check the arguments.
  if (typeof capacity !== 'number' || capacity < 1) {
    throw new Error('capacity must be a non-zero positive integer');
  }

  /**
   * The queue method of a Channel object, used for send
   * and recieving values from a channel.
   *
   * @param {Mixed}
   *
   * @returns {Promise}
   */
  this.queue = function (value) {
    // Called with a value - so a send action.
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

        // Ready to go straight onto the queue.
        return queued.push(function () {
          if (outbound.length > 0) {
            outbound.shift()();
          }

          return resolve(value);
        });
      });
    }

    // Called with no value, so a recieve action.
    return new Promise(function (resolve) {
      // There are no items in the queue.
      if (!queued.length) {
        // The channel was closed, so resolve null.
        if (closed) return resolve(null);

        // The channel is open, wait for a value.
        return outbound.push(() => {
          if (inbound.length > 0) {
            inbound.shift()();
          }

          return resolve(queued.shift());
        });
      }

      if (inbound.length > 0) {
        inbound.shift()();
      }

      return resolve(queued.shift());
    });
  };

  /**
   * A proxy to `this.queue(null)`, for convinience.
   *
   * @returns {Promise}
   */
  this.close = function () {
    return this.queue(null);
  };

  // Accessor for the Channel's `capacity`.
  Object.defineProperty(this, 'capacity', {
    get() { return capacity; },
    set() { return capacity; },
  });

  // Accessor for the Channel's `size`.
  Object.defineProperty(this, 'size', {
    get() { return queued.length + inbound.length; },
    set() { return queued.length + inbound.length; },
  });

  // Accesor indicating if the Channel has been closed.

  Object.defineProperty(this, 'open', {
    get() { return !closed; },
    set() { return !closed; },
  });
};

/**
 * Static send method.
 *
 * @param {Object}
 * @param {Mixed}
 *
 * @returns {Promise}
 */
Channel.send = function (channel, value) {
  return channel.queue(value);
};

/**
 * Static send method.
 *
 * @param {Object}
 *
 * @returns {Promise}
 */
Channel.close = function (channel) {
  return channel.queue(null);
};

/**
 * Static send method.
 *
 * @param {Object}
 *
 * @returns {Promise}
 */
Channel.receive = function (channel) {
  return channel.queue();
};

/**
 * Static send method.
 *
 * @param {Object}
 * @param {Function}
 *
 * @returns {Promise}
 */
Channel.range = async function (channel, fn) {
  let value = await channel.queue();
  while (value !== null) {
    try {
      await fn(value); // eslint-disable-line no-await-in-loop
      value = await channel.queue(); // eslint-disable-line no-await-in-loop
    } catch (err) {
      return Promise.reject(err);
    }
  }

  return Promise.resolve();
};

module.exports = Channel;
