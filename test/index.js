/* eslint-disable no-constant-condition, no-await-in-loop */
const test = require('ava')

const channel = require('../src/index')

const {range, close} = channel

test('instantiation and promise return', t => {
  const chan = channel(1)

  const put = chan('x')

  t.true(put instanceof Promise)

  const take = chan()

  t.true(take instanceof Promise)
})

test('channel size', async t => {
  const chan = channel(2)

  t.true(chan.size === 0)

  t.true(await chan('x') === undefined)
  t.true(await chan('x') === undefined)

  t.true(chan.size === 2)

  const values = []

  values.push(await chan())
  values.push(await chan())

  t.true(JSON.stringify(values) === JSON.stringify(['x', 'x']))

  t.true(chan.size === 0)

  t.true(chan.open === true)

  await chan.close()

  t.true(chan.open === false)
})

const thread = function (output) {
  return async function (input) {
    while (true) {
      const value = await input()
      if (value === null) {
        await output(null)
        break
      }

      await output(value + 1)
    }

    return Promise.resolve()
  }
}

const processed = async function (output) {
  const values = []

  while (true) {
    const value = await output()
    if (value === null) {
      return Promise.resolve(values)
    }

    values.push(value)
  }
}

test('send and recieve queueing', async t => {
  const input = channel(1)
  const output = channel(1)

  thread(output)(input)

  const through = [0, 1, 2, 3, 4, null]
  through.forEach(i => input(i))

  const values = await processed(output)
  t.true(JSON.stringify(values) === JSON.stringify([1, 2, 3, 4, 5]))
})

test('ranging over a channel, closing a channel', async t => {
  const input = channel(1)
  const output = channel(1)
  const ranger = async function () {
    await range(input, v => output(v + 1))
    close(output)

    return Promise.resolve()
  }

  const buffer = async function () {
    const _buffer = []
    await range(output, v => _buffer.push(v))

    return Promise.resolve(_buffer)
  }

  ranger()

  const through = [0, 1, 2, 3, 4, null]
  through.forEach(i => input(i))

  const values = await buffer()
  t.true(JSON.stringify(values) === JSON.stringify([1, 2, 3, 4, 5]))
})
