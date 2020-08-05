module.exports = err => (req, res, next) => {
  const { headers } = req;

  if (!headers.authorization) {
    res.status(401).json(err);
    return;
  }

  // Inject the access token into the request.
  req.accessToken = headers.authorization.replace(/bearer /gi, '');

  next();
};
