const WError = require('../../utils/werror');

module.exports = () => (err, req, res, next) => {
  // Don't delete `next`.
  const errData = WError.getData(err);
  if (errData) {
    console.log(errData);
  } else if (err.response && err.response.body) {
    console.log(err.response.body);
  } else {
    console.log(err);
  }

  // Exit if a response was already sent.
  if (res.headersSent) return;

  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unknown error occurred',
  });
};
