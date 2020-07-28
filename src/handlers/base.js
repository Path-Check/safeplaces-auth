const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

function wrap({ handler, validator }) {
  return (req, res, next) => {
    if (validator) {
      if (!req.body) {
        return res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: 'body is missing',
          errorCode: 'missing_body',
        });
      }

      if (req.body.constructor !== Object) {
        return res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: 'body is not an object',
          errorCode: 'invalid_body',
        });
      }

      const valid = validator(req.body);
      if (!valid) {
        return res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: ajv.errorsText(validator.errors, { dataVar: 'body' }),
          errorCode: 'invalid_body',
        });
      }
    }

    handler(req, res).catch(next);
  };
}

module.exports = wrap;
