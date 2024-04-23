const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { Stock } = require("../models/stocks");
const { errorResponse, generateResponse } = require("../Utils/utilities");
exports.createStock = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before creating a stock
  hasPermission(req.userId, ["createStock"])
    .then((hasPermission) => {
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

      const { materialType, quantity, unit, as_on_date } = req.body;
      const stock = new Stock({
        materialType,
        quantity,
        unit,
        as_on_date,
        updated_user: req.userId, // Assuming the user ID is stored in req.userId
      });
      return stock.save();
    })
    .then((stock) => {
      const responseData = generateResponse(201, "Stock Created", stock, {});
      res.status(201).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.updateStock = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const stockId = req.params.stockId;
  const { materialType, quantity, unit, as_on_date } = req.body;

  Stock.findById(stockId)
    .then((stock) => {
      if (!stock) {
        const response = errorResponse(404, "Stock not found", []);
        return Promise.reject(response);
      }
      return stock;
    })
    .then((stock) => {
      return hasPermission(req.userId, ["updateStock"]).then(
        (hasPermission) => {
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
          return stock;
        }
      );
    })
    .then((stock) => {
      stock.materialType = materialType;
      stock.quantity = quantity;
      stock.unit = unit;
      stock.as_on_date = as_on_date;
      stock.updated_user = req.userId; // Assuming the user ID is stored in req.userId
      return stock.save();
    })
    .then((updatedStock) => {
      const responseData = generateResponse(
        200,
        "Stock Updated",
        updatedStock,
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deleteStock = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const stockId = req.params.stockId;

  Stock.findById(stockId)
    .then((stock) => {
      if (!stock) {
        const response = errorResponse(404, "Stock not found", []);
        return Promise.reject(response);
      }

      // Check permission before deleting the stock
      return hasPermission(req.userId, ["deleteStock"]).then(
        (hasPermission) => {
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
          return Stock.findByIdAndDelete(stockId);
        }
      );
    })
    .then((result) => {
      const responseData = generateResponse(200, "Stock Deleted", result, {});
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.getStocks = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before listing stocks
  hasPermission(req.userId, ["getStocks"])
    .then((hasPermission) => {
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
      return Stock.find();
    })
    .then((stocks) => {
      const responseData = generateResponse(
        200,
        "Stocks Retrieved",
        stocks,
        {}
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
  