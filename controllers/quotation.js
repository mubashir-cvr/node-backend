const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { Quotation } = require("../models/quotation");
const { QuotationItem } = require("../models/quotationItem");
const { errorResponse, generateResponse } = require("../Utils/utilities");
const { Customer } = require("../models/customer");
const { Printer } = require("../models/printer");
exports.createQuotation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before creating a stock item
  hasPermission(req.userId, ["createQuotation", "allAccessToQuotation"]).then(
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
      const { customer } = req.body;
      Quotation.countDocuments()
        .then((count) => {
          const qoutationNumber = "QN" + parseInt(100 + count + 1);
          const newQuotation = new Quotation({
            qoutationNumber,
            customer,
            updated_user: req.userId, // Assuming the user ID is stored in req.userId
          });
          return newQuotation.save();
        })
        .then((quotation) => {
          const responseData = generateResponse(
            201,
            "Quotation Created",
            quotation,
            {}
          );
          res.status(201).json(responseData);
        })
        .catch((error) => {
          const response = errorResponse(500, error.message, []);
          return next(response);
        });
    }
  );
};

exports.updateQuotation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const quotationId = req.params.quotationId;
  const { customer } = req.body;

  Quotation.findById(quotationId)
    .then((quotation) => {
      if (!quotation) {
        const response = errorResponse(404, "Quotation not found", []);
        return Promise.reject(response);
      }
      return quotation;
    })
    .then((quotation) => {
      return hasPermission(req.userId, [
        "updateQuotation",
        "allAccessToQuotation",
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
        return quotation;
      });
    })
    .then((quotation) => {
      quotation.customer = customer;
      quotation.updated_user = req.userId; // Assuming the user ID is stored in req.userId
      return quotation.save();
    })
    .then((updatedQuotation) => {
      const responseData = generateResponse(
        200,
        "Quotation Updated",
        updatedQuotation,
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deleteQuotation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const quotationId = req.params.quotationId;

  Quotation.findById(quotationId)
    .then((quotation) => {
      if (!quotation) {
        const response = errorResponse(404, "Quotation not found", []);
        return Promise.reject(response);
      }

      // Check permission before deleting the stock item
      return hasPermission(req.userId, [
        "deleteQuotation",
        "allAccessToQuotation",
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
        return Quotation.findByIdAndDelete(quotationId);
      });
    })
    .then((result) => {
      const responseData = generateResponse(
        200,
        "Quotation Deleted",
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

exports.getQuotations = (req, res, next) => {
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
  hasPermission(req.userId, ["getQuotation"])
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
        return Customer.find({
          $or: [
            { name: { $regex: new RegExp(search, "i") } },
            { phoneNumber: { $regex: new RegExp(search, "i") } },
          ],
        }).then((customer) => {
          const customerIDs = customer.map((customer) => customer._id);
          query = {
            $or: [
              { qoutationNumber: { $regex: new RegExp(search, "i") } },
              { customer: { $in: customerIDs } },
            ],
          };
          return Promise.all([
            Quotation.find(query)
              .skip(skip)
              .limit(perPage)
              .populate("customer"),
            Quotation.countDocuments(query),
            pageNumber,
            perPage,
          ]);
        });
      }
      return Promise.all([
        Quotation.find(query).skip(skip).limit(perPage).populate("customer"),
        Quotation.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([quotations, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "Quotations Retrieved",
        quotations,
        {
          totalItems,
          nextPage:
            pageNumber < Math.floor(totalItems / perPage)
              ? pageNumber + 1
              : null,
          currentPage: pageNumber,
          totalPages: Math.floor(totalItems / perPage),
        }
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.getQuotationDetails = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }
  const quotationId = req.params.quotationId;
  // Extract pagination and search parameters from request query
  const { page, search } = req.query;
  const pageNumber = parseInt(page) || 1;
  const perPage = 25;
  const skip = (pageNumber - 1) * perPage;

  // Check permission before listing stock items
  hasPermission(req.userId, ["getQuotation"])
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
      let query = { quotation: quotationId };

      return Promise.all([
        Quotation.findById(quotationId).populate("customer"),
        QuotationItem.find(query).skip(skip).limit(perPage),
        QuotationItem.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([quotation, quotationItems, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "Quotations Retrieved",
        { quotation: quotation, quotationItems: quotationItems },
        {
          totalItems,
          nextPage:
            pageNumber < Math.floor(totalItems / perPage)
              ? pageNumber + 1
              : null,
          currentPage: pageNumber,
          totalPages: Math.floor(totalItems / perPage),
        }
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.addQuotationItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response = errorResponse(422, "Validation Failed", errors.array());
      return next(response);
    }

    const quotationId = req.params.quotationId;
    const { item, size, count, testcount } = req.body;
    const printingCopyCount = parseInt(count) + parseInt(testcount);
    if (item.name !== "Printing") {
      return res.status(400).json({ message: "Invalid item type" });
    }

    const printers = await Printer.find({
      isActive: true,
      $or: [
        {
          $and: [
            { maxLength: { $gt: size.dimention_length } },
            { maxBreadth: { $gt: size.dimention_breadth } },
          ],
        },
        {
          $and: [
            { maxLength: { $gt: size.dimention_breadth } },
            { maxBreadth: { $gt: size.dimention_length } },
          ],
        },
      ],
    }).exec();

    let selectedPrinter;
    let layout = {};
    let minCost = Infinity;

    printers.forEach((printer) => {
      const verticalCount =
        Math.floor(printer.maxLength / size.dimention_length) *
        Math.floor(printer.maxBreadth / size.dimention_breadth);

      const horizontalCount =
        Math.floor(printer.maxLength / size.dimention_breadth) *
        Math.floor(printer.maxBreadth / size.dimention_length);
      const maxCopyPerPrint = Math.max(verticalCount, horizontalCount);

      let orientation =
        maxCopyPerPrint === verticalCount ? "vertical" : "horizontal";
      let verticalRows;
      let horizontalColumns;
      let vertialPaperLength;
      let vertialPaperWaste;
      let horizontalPaperLength;
      let horizontalPaperWaste;
      if (orientation === "vertical") {
        verticalRows = Math.floor(printer.maxLength / size.dimention_length);
        horizontalColumns = Math.floor(
          printer.maxBreadth / size.dimention_breadth
        );
        vertialPaperLength = verticalRows * size.dimention_length;
        vertialPaperWaste = printer.maxLength - vertialPaperLength;
        horizontalPaperLength = size.dimention_breadth * horizontalColumns;
        horizontalPaperWaste = printer.maxBreadth - horizontalPaperLength;
      } else {
        verticalRows = Math.floor(printer.maxLength / size.dimention_breadth);
        horizontalColumns = Math.floor(
          printer.maxBreadth / size.dimention_length
        );
        vertialPaperLength = verticalRows * size.dimention_breadth;
        vertialPaperWaste = printer.maxLength - vertialPaperLength;
        horizontalPaperLength = size.dimention_length * horizontalColumns;
        horizontalPaperWaste = printer.maxBreadth - horizontalPaperLength;
      }
      const totalPrint = Math.ceil(printingCopyCount / maxCopyPerPrint);
      const minimumCharge = printer.minimumCharge;
      const maxPrints = printer.maxCountPrintPerMinCharge;
      const extraChargePerAdditionalSet = printer.extraChargePerSet;
      let printingCost = 0;
      if (totalPrint >= printer.minChargeCutOffCount) {
        printingCost +=
          Math.ceil(totalPrint / maxPrints) * extraChargePerAdditionalSet;
      } else {
        printingCost += minimumCharge;
        printingCost +=
          (Math.ceil(totalPrint / maxPrints) - 1) * extraChargePerAdditionalSet;
      }
      if (printingCost < minCost) {
        selectedPrinter = printer;
        layout = {
          orientation,
          horizontalColumns,
          verticalRows,
          horizontalPaperLength,
          horizontalPaperWaste,
          vertialPaperLength,
          vertialPaperWaste,
          printingCost,
          totalPrint,
          copySize: {
            length: size.dimention_length,
            breadth: size.dimention_breadth,
            name: size.name,
          },
          paperSize: {
            length: printer.maxLength,
            breadth: printer.maxBreadth,
          },
          printLayout: {
            length: vertialPaperLength,
            lengthWaste: vertialPaperWaste,
            breadth: horizontalPaperLength,
            breadthWaste: horizontalPaperWaste,
            maxCopyPerPrint,
            orientation,
            printingCost,
            totalPrint,
            count,
            testcount
          },
        };
      }
    });
    const responseData = generateResponse(
      201,
      "priterselected",
      { selectedPrinter, layout },
      {}
    );
    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
};

exports.handleError = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    statusCode: err.statusCode,
    message: err.message || "Internal Server Error",
    data: err.data,
  });
};
