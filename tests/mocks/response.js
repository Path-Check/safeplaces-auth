function Response() {
  this.statusCode = 200;
  this.headers = {};
  this.status = jest.fn(code => {
    this.statusCode = code;
    return this;
  });
  this.send = jest.fn(data => {
    this.body = data;
    return this;
  });
  this.end = jest.fn();
  this.header = jest.fn((header, value) => {
    this.headers[header] = value;
    return this;
  });
  this.set = this.header;
  this.redirect = jest.fn(url => {
    this.redirectUrl = url;
    return this;
  });
}

module.exports = Response;
