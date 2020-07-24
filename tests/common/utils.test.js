const utils = require('../../src/common/utils');

describe('pick', () => {
  it('filters out unselected props', () => {
    const o = {
      a: 1,
      b: 2,
      c: 3,
    };
    const n = utils.pick('a', 'c')(o);
    expect(n).toEqual({
      a: 1,
      c: 3,
    });
  });
});
