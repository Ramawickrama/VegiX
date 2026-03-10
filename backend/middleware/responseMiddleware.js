const responseMiddleware = (req, res, next) => {
  res.success = (data = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  };

  res.error = (message = 'Error', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  };

  res.paginated = (data = [], total = 0, page = 1, limit = 10, message = 'Success') => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  };

  next();
};

module.exports = responseMiddleware;
