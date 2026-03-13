class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function handleError(res, error) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const payload = {
    error: {
      message: error.message || "Internal server error"
    }
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  const body = JSON.stringify(payload, null, 2);
  // Bug fix: CORS headers must be set on error responses too, otherwise the browser
  // can't read the error message from the failed request
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(body);
}

module.exports = {
  AppError,
  handleError
};
