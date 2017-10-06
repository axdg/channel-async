/* eslint-disable import/no-unresolved, no-cond-assign, no-shadow, no-console, import/no-unresolved, max-len */
const Channel = require('channel-async')

function sender(channel, data) {
  const values = [...data]

  let value
  while (value = values.shift()) {
    Channel.send(channel, value)
  }

  Channel.close(channel)
}

async function receiver(channel) {
  const values = []
  await Channel.range(channel, values.push)
  return values
}

const channel = new Channel(1)
const data = [1, 2, 3, 4, 5]

sender(channel, data)
receiver(channel).then(data => console.log(data))

// => '[1, 2, 3, 4, 5]'
