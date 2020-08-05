const ow = require('ow');

const uuidRegexp = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

const ROLES = ['contact_tracer', 'admin', 'super_admin'];

module.exports = {
  id: ow.object.exactShape({
    id: ow.string.matches(uuidRegexp),
  }),
  create: ow.object.exactShape({
    email: ow.string,
    role: ow.string.oneOf(ROLES),
    organization_id: ow.string,
    redirect_url: ow.string,
  }),
  assignRole: ow.object.exactShape({
    id: ow.string.matches(uuidRegexp),
    role: ow.string.oneOf(ROLES),
  }),
  register: ow.object.exactShape({
    name: ow.string,
    password: ow.string,
  }),
};
