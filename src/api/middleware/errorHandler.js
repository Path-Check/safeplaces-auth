const WError = require('../../utils/werror');

// Don't delete `next`.
// eslint-disable-next-line no-unused-vars
module.exports = () => (err, req, res, next) => {
  console.log('Error handler:');
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
