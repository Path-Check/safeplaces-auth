/**
 * Middleware for injecting the IDM ID of a user into the request body.
 */
module.exports = config => {
  const { db } = config;

  return async function (req, res, next) {
    const { id } = req.body;

    let idmId;
    try {
      idmId = await db.dbToIdm(id);
    } catch (e) {
      res.status(500).json({
        error: 'DBError',
        message: 'Unable to find user in DB',
      });

      throw e;
    }

    if (!idmId) {
      res.status(404).json({
        error: 'UserNotFound',
        message: 'User not found',
      });
      return;
    }
    req.body.idmId = idmId;

    next();
  };
};
