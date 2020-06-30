function Application() {
  this._middlewares = [];
  this.use = jest.fn(fn => {
    this._middlewares.push(fn);
  });
  this._handle = async (req, res, next) => {
    for (const fn of this._middlewares) {
      fn(req, res, next);
    }
  };
}

module.exports = Application;
