function pick(...props) {
  return o => props.reduce((r, k) => ({ ...r, [k]: o[k] }), {});
}

module.exports = { pick };
