const AppError = require("../utils/AppError");

function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join(".");
      return next(new AppError(400, field ? `${field}: ${issue.message}` : issue.message));
    }
    if (source === "query") req.validQuery = result.data;
    else req[source] = result.data;
    next();
  };
}

module.exports = validate;
