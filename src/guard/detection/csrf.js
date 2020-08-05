const WError = require('../../utils/werror');

module.exports = req => {
  if (!req.headers) {
    throw new WError({
      name: 'MissingHeaders',
      message: 'No headers found',
    });
  }

  const csrfHeader = req.headers['x-requested-with'];
  if (!csrfHeader) {
    throw new WError({
      name: 'MissingCSRFHeader',
      message: 'CSRF header not found',
    });
  }

  if (csrfHeader !== 'XMLHttpRequest') {
    throw new WError({
      name: 'InvalidCSRFHeader',
      message: 'Invalid value in CSRF header: ' + csrfHeader,
    });
  }
};
