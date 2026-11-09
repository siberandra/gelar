// Error yang sengaja dilempar service. statusCode-nya dipakai error handler sebagai kode HTTP.
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
