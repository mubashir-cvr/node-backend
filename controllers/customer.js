const { validationResult } = require("express-validator");
const { hasPermission } = require("../middleware/hasPermission");
const { Customer } = require("../models/customer");
const { errorResponse, generateResponse } = require("../Utils/utilities");
exports.createCustomer = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
  
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before creating a stock item
  hasPermission(req.userId, ["createCustomer", "allAccessToCustomer"])
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

      const { name, address, phoneNumber, status, customerType } = req.body;
      const newCustomer = new Customer({
        name,
        address,
        phoneNumber,
        status,
        customerType,
        updated_user: req.userId, // Assuming the user ID is stored in req.userId
      });
      return newCustomer.save();
    })
    .then((customer) => {
      const responseData = generateResponse(
        201,
        "Customer Created",
        customer,
        {}
      );
      res.status(201).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.updateCustomer = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const customerId = req.params.customerId;
  const { name, address, phoneNumber, status, customerType } = req.body;

  Customer.findById(customerId)
    .then((customer) => {
      if (!customer) {
        const response = errorResponse(404, "Customer not found", []);
        return Promise.reject(response);
      }
      return customer;
    })
    .then((customer) => {
      return hasPermission(req.userId, [
        "updateCustomer",
        "allAccessToCustomer",
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
        return customer;
      });
    })
    .then((customer) => {
      customer.name = name;
      customer.address = address;
      customer.phoneNumber = phoneNumber;
      customer.status = status;
      customer.customerType = customerType;
      customer.updated_user = req.userId; // Assuming the user ID is stored in req.userId
      return customer.save();
    })
    .then((updatedCustomer) => {
      const responseData = generateResponse(
        200,
        "Customer Updated",
        updatedCustomer,
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deleteCustomer = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const customerId = req.params.customerId;

  Customer.findById(customerId)
    .then((customer) => {
      if (!customer) {
        const response = errorResponse(404, "Customer not found", []);
        return Promise.reject(response);
      }

      // Check permission before deleting the stock item
      return hasPermission(req.userId, [
        "deleteCustomer",
        "allAccessToCustomer",
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
        return Customer.findByIdAndDelete(customerId);
      });
    })
    .then((result) => {
      const responseData = generateResponse(
        200,
        "Customer Deleted",
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

exports.getCustomers = (req, res, next) => {
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
  hasPermission(req.userId, ["getCustomer"])
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
          $or: [{ name: { $regex: new RegExp(search, "i") } },{ phoneNumber: { $regex: new RegExp(search, "i") } }],
        };
      }
      // Fetch stock items with pagination and search
      return Promise.all([
        Customer.find(query).skip(skip).limit(perPage),
        Customer.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([customers, totalItems, pageNumber, perPage]) => {
      const responseData = generateResponse(
        200,
        "Customers Retrieved",
        customers,
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
