module.exports = function (err, req, res, next) {
  console.error(err);
  res.status(500).json({
    errors: [{
      msg: err.message,
      stack: err.stack,
    }],
  });
};
