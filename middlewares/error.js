module.exports = function (err, req, res, next) {
  console.error(err);
  res.status(500).json({
    errors: [{
      message: err.message,
      stack: err.stack,
    }],
  });
};
