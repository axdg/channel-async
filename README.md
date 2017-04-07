# pchan

> JS channels implementation... for async fun.

[![CircleCI](https://circleci.com/gh/axdg/pchan.svg?style=shield)](https://circleci.com/gh/axdg/pchan)

## About

This is mt first attempt at pure JS implementation of [golang](https://golang.org/) style [channels](https://tour.golang.org/concurrency/2). The premise of channels for JS is that (in concert with [ES2017 async / await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) and [promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)) they can be used to write heavily asyncronous and **parallel-ish** in a very readable and pleasant way. Specially, they allow for functions resembling threads (or [goroutines](https://tour.golang.org/concurrency/1)) to be chained and syncronised with minimal effort.

pchan is feature complete and pretty performant, it allows for channel creation, buffering and closing, channel sends / recieves and ranging over open channels. The API is not particularly javascripty (as much a is practical, it resembles the golang API). The next attempt will just be an effort to make a channels look like more idiomatic JS.

## Usage

```js
const make = require('pchan')

const {range, close} = make

function sender(channel, data) {
  const values = [...data]

  let value
  while (value = values.shift()) {
    channel(value)
  }

  close(channel)
}

async function receiver(channel) {
  const values = []
  range(channel, value => values.push(value))

  return values
}

const chan = make(1)
const data = [1, 2, 3, 4, 5]

sender(chan, data)
receiver(chan).then(data => console.log(data))

// => '[1, 2, 3, 4, 5]'
```

## API

### make([*capacity*])

 - **capacity** (`number`) - the size of the channels buffer.

Returns a `channel` that will buffer `capacity` value(s).

### channel([*value*])

 - **value** (`mixed`) - the value to send into the channel.

**sending:** calling `channel` with `value` will send that value into the channel, and return a promise that resolves `undefined` when space for that value is available in the internal buffer.

**closing:** calling `channel` with the value `null` will close the channel; any subsequent sends will throw an error, but receives can continue until indefinitely, and will resolve with any remaining internally buffered values, or `null` if none remain.

**receving:** when `channel` is called with no arguments it will return a promise that resolves when a value from the `channel`'s internal buffer is avaiable.

### channel.close()

A convinience function used to close the channel, equivalent to `channel(null)`.

### range(*channel*, *fn*)

 - **channel** (`function`) - the channel to range over.
 - **fn** (`function`) - the callback function (called for each received value).

Calling `range` with a `channel` and a callback function (`fn`) will continue to receive from `channel`, passing each value to the supplied callback until the channel is closed. 

## License

&bull; **MIT** &copy; axdg ([axdg@dfant.asia](mailto:axdg@dfant.asia)), 2107 &bull;
