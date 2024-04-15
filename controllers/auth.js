const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { hasPermission } = require("../middleware/hasPermission");
const { Permission, Role } = require("../models/role");
const { errorResponse, generateResponse } = require("../Utils/utilities");
exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    next(error);
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name,
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: "User created!", userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        let response = errorResponse(401, "Invalid User Name or Password", [
          { email: "A user with this email could not be found." },
        ]);
        return next(response);
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        let response = errorResponse(401, "Invalid User Name or Password", [
          { password: "Wrong password!" },
        ]);
        return next(response);
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "somesupersecretsecret",
        { expiresIn: "24h" }
      );
      let responseData = generateResponse(
        200,
        "Token Generated",
        [{ token: token, userId: loadedUser._id.toString() }],
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((err) => {
      let response = errorResponse(500, err.message, []);
      return next(response);
    });
};

exports.updateUser = (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  // Extract fields from request body
  const {
    email,
    name,
    password,
    department,
    address,
    phoneNumber,
    profilePicture,
    role,
  } = req.body;

  // Find the user by ID
  User.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      // Update user fields
      user.email = email;
      user.name = name;
      user.department = department;
      user.address = address;
      user.phoneNumber = phoneNumber;
      user.profilePicture = profilePicture;
      user.roles = role; // Assuming role is an array of role IDs

      // If password is provided, hash and update password
      if (password) {
        return bcrypt.hash(password, 12).then((hashedPw) => {
          user.password = hashedPw;
          return user.save();
        });
      } else {
        return user.save();
      }
    })
    .then((result) => {
      res.status(200).json({ message: "User updated!", user: result });
    })
    .catch((err) => {
      // Handle errors
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.checkAuth = (req, res, next) => {
  const userId = req.userId;
  let responseData = generateResponse(
    201,
    "Authenticated.",
    [{user_id: userId}],
    {}
  );
  res.status(200).json(responseData);
};

exports.getPermissions = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 50;
  let totalItems;
  hasPermission(req.userId, "readPermission").then((hasPermission) => {
    if (hasPermission) {
      Permission.find()
        .countDocuments()
        .then((count) => {
          totalItems = count;
          return Permission.find()
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        })
        .then((permissions) => {
          let responseData = generateResponse(
            200,
            "Fetched permissions successfully.",
            [permissions],
            { totalItems: totalItems, nextPage: currentPage + 1 }
          );
          res.status(200).json(responseData);
        })
        .catch((err) => {
          let response = errorResponse(500, err.message, []);
          return next(response);
        });
    } else {
      console.log(hasPermission);
      let responseData = [
        {
          type: "permission",
          msg: "Insufficient privilege",
          path: "permission",
          location: "db",
        },
      ];
      let response = errorResponse(405, "Insufficient privilege", responseData);
      return next(response);
    }
  });
};
exports.createPermission = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  hasPermission(req.userId, "createPermission")
    .then((hasPermission) => {
      if (hasPermission) {
        const { name, description, objectname } = req.body;
        const permission = new Permission({
          name,
          description,
          objectname,
        });
        return permission.save();
      } else {
        let responseData = [
          {
            type: "permission",
            msg: "Insufficient privilege",
            path: "permission",
            location: "db",
          },
        ];
        let response = errorResponse(
          405,
          "Insufficient privilege",
          responseData
        );
        return next(response);
      }
    })
    .then((result) => {
      let responseData = generateResponse(
        201,
        "Permission Created",
        [result],
        {}
      );
      res.status(201).json(responseData);
    })
    .catch((error) => {
      let response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deletePermission = (req, res, next) => {
  const permissionId = req.params.permissionId;
  hasPermission(req.userId, "allAccess").then((hasPermission) => {
    if (hasPermission) {
      Permission.findById(permissionId).then((permission) => {
        if (
          permission.name !== "allAccess" &&
          permission.name !== "adminAccess"
        ) {
          Permission.findByIdAndDelete(permissionId)
            .then((deletedPermission) => {
              if (!deletedPermission) {
                let response = errorResponse(404, "Object not Found", []);
                return next(response);
              }

              let responseData = generateResponse(
                200,
                "Permission deleted successfully",
                [deletedPermission],
                {}
              );
              res.status(200).json(responseData);
            })
            .catch((error) => {
              let response = errorResponse(500, error.message, []);
              return next(response);
            });
        }
      });
    } else {
      let responseData = [
        {
          type: "permission",
          msg: "Insufficient privilege",
          path: "permission",
          location: "db",
        },
      ];
      let response = errorResponse(405, "Insufficient privilege", responseData);
      return next(response);
    }
  });
};

// Controller function for handling errors
exports.handleError = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    statusCode: err.statusCode,
    message: err.message || "Internal Server Error",
    data: err.data,
  });
};
