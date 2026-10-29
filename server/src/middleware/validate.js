export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          issues: err.errors ? err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) : err.message
        }
      });
    }
  };
}
