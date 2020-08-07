const ROLE_RANKS = ['super_admin', 'admin', 'contact_tracer'];

/**
 * Determines the highest-ranking role of an array of roles.
 *
 * @param roles{Array<string>} An array of roles.
 * @returns {null|*} The highest ranking role, or null if no roles were given.
 */
const findHighestUserRole = roles => {
  if (roles.length === 0) {
    return null;
  }
  roles.sort((r1, r2) => ROLE_RANKS.indexOf(r1) - ROLE_RANKS.indexOf(r2));
  return roles[0];
};

module.exports = { findHighestUserRole };
