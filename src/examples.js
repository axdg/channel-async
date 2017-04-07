/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, no-cond-assign */
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
