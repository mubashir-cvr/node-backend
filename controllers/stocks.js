const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { Stock } = require("../models/stocks");
const { errorResponse, generateResponse } = require("../Utils/utilities");

exports.getStocks = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }
  const { page, search } = req.query;
  const pageNumber = parseInt(page) || 1;
  const perPage = 25;
  const skip = (pageNumber - 1) * perPage;
  hasPermission(req.userId, ["getStock"]).then((hasPermission) => {
    if (!hasPermission) {
      const responseData = [
        {
          type: "permission",
          msg: "Insufficient privilege",
          path: "permission",
          location: "db",
        },
      ];
      const response = errorResponse(
        405,
        "Insufficient privilege",
        responseData
      );
      return Promise.reject(response);
    }
    // Construct query based on search parameter
    let query = {};
    if (search) {
      query = {
        $or: [
          { "item.name": { $regex: new RegExp(search, "i") } },
        ],
      };
    }
    // Fetch stock items with pagination and search
    return Promise.all([
      Stock.find(query).skip(skip).limit(perPage),
      Stock.countDocuments(query),
      pageNumber,
      perPage,
    ]);
  }).then(([stocks, totalItems, pageNumber, perPage]) => {
    const responseData = generateResponse(
      200,
      "Stock Items Retrieved",
      stocks,
      {
        totalItems,
        nextPage:
          pageNumber < Math.ceil(totalItems / perPage) ? pageNumber + 1 : null,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalItems / perPage),
      }
    );
    res.status(200).json(responseData);
  })
  .catch((error) => {
    const response = errorResponse(500, error.message, []);
    return next(response);
  });
};

exports.handleError = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    statusCode: err.statusCode,
    message: err.message || "Internal Server Error",
    data: err.data,
  });
};
