/**
 * Wrapped error object.
 */
class WError extends Error {
  constructor(options) {
    const message = options.cause
      ? `${options.message}: ${options.cause.message}`
      : options.message;
    super(message);
    this.name = options.name || 'Error';
    this.data = options.data || {};
    this.cause = options.cause;
  }

  static getCause(err) {
    if (err.cause) {
      return err.cause;
    }
    return null;
  }

  static getData(err) {
    if (err.data) {
      return err.data;
    }
    return null;
  }

  static hasCauseWithName(err, name) {
    if (err.name === name) return true;
    const cause = WError.getCause(err);
    if (cause) {
      return WError.hasCauseWithName(cause, name);
    }
    return false;
  }
}

module.exports = WError;
