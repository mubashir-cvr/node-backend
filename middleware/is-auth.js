const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    error.data ={"usermessage":"Not authenticated."};
    return next(error); // Pass the error to the error handling middleware
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'somesupersecretsecret');
  } catch (err) {
    err.statusCode = 500;
    return next(err); // Pass the error to the error handling middleware
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    error.data ={"usermessage":"Not authenticated."};

    return next(error); // Pass the error to the error handling middleware
  }
  req.userId = decodedToken.userId;
  next();
};