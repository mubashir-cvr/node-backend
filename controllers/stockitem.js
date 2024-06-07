const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const StockItem = require("../models/stockItem");
const { errorResponse, generateResponse } = require("../Utils/utilities");

exports.createStockItem = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before creating a stock item
  hasPermission(req.userId, ["createStockItem"])
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

      const {
        item,
        item_type,
        gsm,
        dimention_length,
        dimention_breadth,
        unit_of_measurement,
        unitPrice,
        suitablePrinters,
        as_on_date,
      } = req.body;
      const newStockItem = new StockItem({
        item,
        item_type,
        gsm,
        dimention_length,
        dimention_breadth,
        unit_of_measurement,
        unitPrice,
        suitablePrinters,
        as_on_date,
        updated_user: req.userId, // Assuming the user ID is stored in req.userId
      });
      return newStockItem.save();
    })
    .then((stockItem) => {
      const responseData = generateResponse(
        201,
        "Stock Item Created",
        stockItem,
        {}
      );
      res.status(201).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.updateStockItem = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const stockItemId = req.params.stockItemId;
  const {
    item,
    item_type,
    gsm,
    dimention_length,
    dimention_breadth,
    unit_of_measurement,
    unitPrice,
    suitablePrinters,
  } = req.body;

  StockItem.findById(stockItemId)
    .then((stockItem) => {
      if (!stockItem) {
        const response = errorResponse(404, "Stock Item not found", []);
        return Promise.reject(response);
      }
      return stockItem;
    })
    .then((stockItem) => {
      return hasPermission(req.userId, ["updateStockItem"]).then(
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
          return stockItem;
        }
      );
    })
    .then((stockItem) => {
      stockItem.item = item;
      stockItem.item_type = item_type;
      stockItem.gsm = gsm;
      stockItem.dimention_length = dimention_length;
      stockItem.dimention_breadth = dimention_breadth;
      stockItem.unit_of_measurement = unit_of_measurement;
      stockItem.unitPrice = unitPrice;
      stockItem.suitablePrinters = suitablePrinters;
      stockItem.updated_user = req.userId; // Assuming the user ID is stored in req.userId
      return stockItem.save();
    })
    .then((updatedStockItem) => {
      StockItem.findById(updatedStockItem._id)
        .populate({
          path: "suitablePrinters.printer",
          model: "Printer",
        })
        .then((responseStock) => {
          const responseData = generateResponse(
            200,
            "Stock Item Updated",
            responseStock,
            {}
          );
          res.status(200).json(responseData);
        })
        .catch((error) => {
          const response = errorResponse(500, error.message, []);
          return next(response);
        });
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deleteStockItem = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const stockItemId = req.params.stockItemId;

  StockItem.findById(stockItemId)
    .then((stockItem) => {
      if (!stockItem) {
        const response = errorResponse(404, "Stock Item not found", []);
        return Promise.reject(response);
      }

      // Check permission before deleting the stock item
      return hasPermission(req.userId, ["deleteStockItem"]).then(
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
          return StockItem.findByIdAndDelete(stockItemId);
        }
      );
    })
    .then((result) => {
      const responseData = generateResponse(
        200,
        "Stock Item Deleted",
        result,
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.getStockItems = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Extract pagination and search parameters from request query
  const { page, search } = req.query;
  const pageNumber = parseInt(page) || 1;
  const perPage = 25;
  const skip = (pageNumber - 1) * perPage;

  // Check permission before listing stock items
  hasPermission(req.userId, ["getStockItem"])
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
      // Construct query based on search parameter
      let query = {};
      if (search) {
        query = {
          $or: [
            { item: { $regex: new RegExp(search, "i") } },
            { item_type: { $regex: new RegExp(search, "i") } },
            // Add more fields for search if needed
          ],
        };
      }
      // Fetch stock items with pagination and search
      return Promise.all([
        StockItem.find(query).skip(skip).limit(perPage).populate({
          path: "suitablePrinters.printer",
          model: "Printer",
        }),
        StockItem.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([stockItems, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "Stock Items Retrieved",
        stockItems,
        {
          totalItems,
          nextPage:
            pageNumber < Math.ceil(totalItems / perPage)
              ? pageNumber + 1
              : null,
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
