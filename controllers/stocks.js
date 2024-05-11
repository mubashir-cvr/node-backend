const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { Stock } = require("../models/stocks");
const { errorResponse, generateResponse } = require("../Utils/utilities");
const mongoose = require("mongoose");
const StockItem = require("../models/stockItem");
const { StockLedger } = require("../models/stockLedger");

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

  hasPermission(req.userId, ["getStock", "allAccessToStock"])
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

      let query = {};
      if (search) {
        return StockItem.find({
          item: { $regex: new RegExp(search, "i") },
        }).then((stockItems) => {
          const itemIds = stockItems.map((item) => item._id);
          query = { item: { $in: itemIds } };
          return query;
        });
      } else {
        return query;
      }
    })
    .then((query) => {
      return Promise.all([
        Stock.find(query).populate("item").skip(skip).limit(perPage),
        Stock.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([stocks, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "Stock Items Retrieved",
        stocks,
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

exports.createStock = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  hasPermission(req.userId, ["createStock", "allAccessToStock"])
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

      const { item, quantity, amount } = req.body;
      let stock;
      let is_new;
      let ledger;

      // Start Mongoose session for transaction
      return mongoose.startSession().then((session) => {
        session.startTransaction();

        return Stock.findOne({ item: item })
          .session(session)
          .then((foundStock) => {
            stock = foundStock;
            if (stock) {
              stock.quantity =
                parseFloat(stock.quantity) + parseFloat(quantity);
              stock.updated_user = req.userId;
              is_new = false;
            } else {
              stock = new Stock({
                item,
                quantity,
                updated_user: req.userId,
              });
              is_new = true;
            }
            return stock.save({ session });
          })
          .then((savedStock) => {
            stock = savedStock;
            ledger = new StockLedger({
              item: stock.item,
              transactionType: "Purchase",
              quantity: quantity,
              inOrOut: "IN",
              amount: amount,
              updated_user: req.userId,
            });

            return ledger.save({ session }).then(() => {
              return session
                .commitTransaction()
                .then(() => {
                  session.endSession();
                  return [stock, is_new];
                })
                .catch((commitErr) => {
                  session.abortTransaction();
                  session.endSession();
                  return Promise.reject(commitErr);
                });
            });
          })
          .catch((err) => {
            session.abortTransaction();
            session.endSession();
            return Promise.reject(err);
          });
      });
    })
    .then(([stock, is_new]) => {
      return Stock.findById(stock._id)
        .populate("item")
        .then((resultStock) => {
          const responseData = generateResponse(
            201,
            is_new ? "Stock Created" : "Stock Updated",
            resultStock,
            { is_new: is_new }
          );
          res.status(201).json(responseData);
        });
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
