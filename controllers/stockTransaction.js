const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { errorResponse, generateResponse } = require("../Utils/utilities");
const { StockLedger } = require("../models/stockLedger");
const StockItem = require("../models/stockItem");
exports.getStockLedgers = (req, res, next) => {
  const _itemID=req.params.itemID;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }
  const { page, search,itemID } = req.query;
  const pageNumber = parseInt(page) || 1;
  const perPage = 25;
  const skip = (pageNumber - 1) * perPage;

  hasPermission(req.userId, [
    "getStockLedger",
    "allAccessToStockLedger",
  ])
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

      let query = {item:_itemID};
      if (search) {
        return StockItem.find({
          item: { $regex: new RegExp(search, "i") },
        }).then((StockLedgerItems) => {
          const itemIds = StockLedgerItems.map((item) => item._id);
          query = { item: { $in: itemIds } };
          return query;
        });
      } else {
        return query;
      }
    })
    .then((query) => {
      return Promise.all([
        StockLedger.find(query)
          .populate({ path: "item", select: "item item_type" })
          .populate({ path: "updated_user", select: "email name" })
          .skip(skip)
          .limit(perPage),
        StockLedger.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([StockLedgers, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "StockLedger Items Retrieved",
        StockLedgers,
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
