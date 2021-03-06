const ow = require('ow');

module.exports = {
  none: ow.object.exactShape({}),
  enroll: ow.object.exactShape({
    phone_number: ow.string.matches(/^\+[1-9]\d{1,14}$/),
  }),
  verify: ow.object.exactShape({
    oob_code: ow.string,
    binding_code: ow.string,
  }),
  recover: ow.object.exactShape({
    recovery_code: ow.string,
  }),
};
