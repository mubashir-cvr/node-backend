const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { Printer } = require("../models/printer");
const { errorResponse, generateResponse } = require("../Utils/utilities");
exports.createPrinter = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before creating a stock item
  hasPermission(req.userId, ["createPrinter", "allAccessToPrinter"])
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
        name,
        printingMaterial,
        maxLength,
        maxBreadth,
        minimumCharge,
        maxCountPrintPerMinCharge,
        extraChargePerSet,
        minChargeCutOffCount,
      } = req.body;
      const newPrinter = new Printer({
        name,
        printingMaterial,
        maxLength,
        maxBreadth,
        minimumCharge,
        maxCountPrintPerMinCharge,
        extraChargePerSet,
        minChargeCutOffCount,
        updated_user: req.userId, // Assuming the user ID is stored in req.userId
      });
      return newPrinter.save();
    })
    .then((printer) => {
      const responseData = generateResponse(
        201,
        "Stock Item Created",
        printer,
        {}
      );
      res.status(201).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.updatePrinter = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const printerId = req.params.printerId;
  const {
    name,
    printingMaterial,
    maxLength,
    maxBreadth,
    minimumCharge,
    maxCountPrintPerMinCharge,
    extraChargePerSet,
    minChargeCutOffCount,
  } = req.body;

  Printer.findById(printerId)
    .then((printer) => {
      if (!printer) {
        const response = errorResponse(404, "Stock Item not found", []);
        return Promise.reject(response);
      }
      return printer;
    })
    .then((printer) => {
      return hasPermission(req.userId, [
        "updatePrinter",
        "allAccessToPrinter",
      ]).then((hasPermission) => {
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
        return printer;
      });
    })
    .then((printer) => {
      printer.name = name;
      printer.printingMaterial = printingMaterial;
      printer.maxLength = maxLength;
      printer.maxBreadth = maxBreadth;
      printer.minimumCharge = minimumCharge;
      printer.maxCountPrintPerMinCharge = maxCountPrintPerMinCharge;
      printer.extraChargePerSet = extraChargePerSet;
      printer.minChargeCutOffCount = minChargeCutOffCount;
      printer.updated_user = req.userId; 
      return printer.save();
    })
    .then((updatedPrinter) => {
      const responseData = generateResponse(
        200,
        "Stock Item Updated",
        updatedPrinter,
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deletePrinter = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const printerId = req.params.printerId;

  Printer.findById(printerId)
    .then((printer) => {
      if (!printer) {
        const response = errorResponse(404, "Stock Item not found", []);
        return Promise.reject(response);
      }

      // Check permission before deleting the stock item
      return hasPermission(req.userId, [
        "deletePrinter",
        "allAccessToPrinter",
      ]).then((hasPermission) => {
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
        return Printer.findByIdAndDelete(printerId);
      });
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

exports.getPrinters = (req, res, next) => {
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
  hasPermission(req.userId, ["getPrinter"])
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
          $or: [{ name: { $regex: new RegExp(search, "i") } }],
        };
      }
      // Fetch stock items with pagination and search
      return Promise.all([
        Printer.find(query).skip(skip).limit(perPage),
        Printer.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([printers, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "Stock Items Retrieved",
        printers,
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
