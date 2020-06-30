function mockRequest(data) {
  return {
    cookies: data.cookies,
    headers: data.headers,
  };
}

module.exports = mockRequest;
