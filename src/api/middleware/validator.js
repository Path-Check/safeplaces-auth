const ow = require('ow');

module.exports = predicate => {
  const validate = ow.create('body', predicate);

  return (req, res, next) => {
    try {
      validate(req.body);
    } catch (e) {
      return res.status(400).json({
        error: 'Bad Request',
        message: e.message,
      });
    }

    return next();
  };
};
