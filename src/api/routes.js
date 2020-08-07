module.exports = {
  guard: config => ({
    login: require('./login/controller')(config),
    logout: require('./logout/controller')(config),
    mfa: require('./mfa/controller')(config),
  }),
  management: config => ({
    users: require('./users/controller')(config),
  }),
};
