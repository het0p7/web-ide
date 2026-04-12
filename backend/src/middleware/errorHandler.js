const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(", ");
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export default errorHandler;
