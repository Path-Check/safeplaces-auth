function Response() {
  this.statusCode = 200;
  this.status = jest.fn(code => {
    this.statusCode = code;
    return this;
  });
  this.send = jest.fn(data => {
    this.body = data;
    return this;
  });
}

module.exports = Response;
