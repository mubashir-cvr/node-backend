const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { PageSize } = require("../models/PageSize");
const { errorResponse, generateResponse } = require("../Utils/utilities");
exports.createPageSize = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before creating a stock item
  hasPermission(req.userId, ["createPageSize", "allAccessToPageSize"])
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

      const { name, dimention_length, dimention_breadth } = req.body;
      const newPageSize = new PageSize({
        name,
        dimention_length,
        dimention_breadth,
        updated_user: req.userId, // Assuming the user ID is stored in req.userId
      });
      return newPageSize.save();
    })
    .then((pageSize) => {
      const responseData = generateResponse(
        201,
        "Stock Item Created",
        pageSize,
        {}
      );
      res.status(201).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.updatePageSize = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const pageSizeId = req.params.pageSizeId;
  const { name, dimention_length, dimention_breadth } = req.body;

  PageSize.findById(pageSizeId)
    .then((pageSize) => {
      if (!pageSize) {
        const response = errorResponse(404, "Stock Item not found", []);
        return Promise.reject(response);
      }
      return pageSize;
    })
    .then((pageSize) => {
      return hasPermission(req.userId, [
        "updatePageSize",
        "allAccessToPageSize",
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
        return pageSize;
      });
    })
    .then((pageSize) => {
      pageSize.name = name;
      pageSize.dimention_length = dimention_length;
      pageSize.dimention_breadth = dimention_breadth;
      pageSize.updated_user = req.userId; // Assuming the user ID is stored in req.userId
      return pageSize.save();
    })
    .then((updatedPageSize) => {
      const responseData = generateResponse(
        200,
        "Stock Item Updated",
        updatedPageSize,
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deletePageSize = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const pageSizeId = req.params.pageSizeId;

  PageSize.findById(pageSizeId)
    .then((pageSize) => {
      if (!pageSize) {
        const response = errorResponse(404, "Stock Item not found", []);
        return Promise.reject(response);
      }

      // Check permission before deleting the stock item
      return hasPermission(req.userId, [
        "deletePageSize",
        "allAccessToPageSize",
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
        return PageSize.findByIdAndDelete(pageSizeId);
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

exports.getPageSizes = (req, res, next) => {
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
  hasPermission(req.userId, ["getPageSize"])
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
            { name: { $regex: new RegExp(search, "i") } },
          ],
        };
      }
      // Fetch stock items with pagination and search
      return Promise.all([
        PageSize.find(query).skip(skip).limit(perPage),
        PageSize.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([pageSizes, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "Stock Items Retrieved",
        pageSizes,
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
