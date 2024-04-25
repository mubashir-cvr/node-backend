const jwt = require("jsonwebtoken");
const { errorResponse } = require("../Utils/utilities");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    let response = errorResponse(401, "Not authenticated.", []);
    return next(response); // Pass the error to the error handling middleware
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "somesupersecretsecret");
  } catch (err) {
    let response = errorResponse(401,err.message , []);
    return next(response); 
  }
  if (!decodedToken) {
    let response = errorResponse(401, "Not authenticated.", []);
    return next(response);
  }
  req.userId = decodedToken.userId;
  next();
};
