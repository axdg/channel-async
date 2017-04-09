/**
 * We need to run these tests with async-to-gen to get
 * them working in the latest stable version of electron...
 * which still doesn't have support for the `async / await`
 * syntax.
 */
const expect = require(expect);

const Channel = require('./src/_index');

describe('Channel', function () {
  describe('existence of all exported methods');
  describe('seding and receiving of values');
  describe('ranging over an open channel');
});
