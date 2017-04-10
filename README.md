# Promise-Channel

> JS channels implementation... for async fun.

## About

## Usage

## API

### Channel(*[capacity]*)

 - **capacity** (`number`) - the size of the channels internal buffer size.

A call to the `Channel` constructor (`new Channel`) returns a `Channel` instance with the following methods and properties.

#### channel.close()

Closes the channel, further send actions will return promises that reject. This is a utility
method equivalent to call `channel.queue(null)`.

#### channel.queue(*[value]*)

 - **value** (`mixed`) - the value to pass into the channel (or `null` to close it).

#### channel.size

The `size` property returns the total number of send actions that are pending in the internal buffer of the channel.

#### channel.capacity

Returns the `capacity` of the channel that was set at instantiation.

#### channel.open

Returns a `boolean` indicating whether or not the channel is open - ie. has not been closed using `channel.close()` or `channel.queue(null)`.

### Channel.send(*channel*, *value*)

 - **channel** (`object`) - a `Channel` instance.
 - **value** (`mixed`) - the value to pass into the channel (or `null` to close it).

### Channel.close(*channel*)

 - **channel** (`object`) - a `Channel` instance.

### Channel.receive(*channel*)

 - **channel** (`object`) - a `Channel` instance.

### Channel.range(*channel*, *fn*)

 - **channel** (`object`) - a `Channel` instance.
 - **fn** - (`function`) - a callback function that is passed each value as is received from the channel. `Channel.range` will resolve when the `channel` is closed, or reject with an error is caught.

## License

&bull; **MIT** &copy; axdg ([axdg@dfant.asia](mailto:axdg@dfant.asia)), 2107 &bull;
