const Response = require('./response');

function Application() {
  this.use = jest.fn(fn => {
    const req = {};
    fn(req, new Response(), jest.fn());
  });
}

module.exports = Application;
