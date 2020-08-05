const call = async (handle, err, req, res, next) => {
  const arity = handle.length;
  let error = err;
  const hasError = Boolean(err);

  try {
    if (hasError && arity === 4) {
      await handle(err, req, res, next);
      return;
    } else if (!hasError && arity < 4) {
      await handle(req, res, next);
      return;
    }
  } catch (e) {
    error = e;
  }

  next(error);
};

const sequential = (...stack) => {
  return (req, res, done) => {
    let index = 0;

    const next = err => {
      const layer = stack[index++];
      if (!layer) {
        setImmediate(done, err);
        return;
      }

      return call(layer, err, req, res, next);
    };

    next();
  };
};

module.exports = sequential;
