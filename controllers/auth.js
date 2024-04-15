const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { hasPermission } = require("../middleware/hasPermission");
const { Permission, Role } = require("../models/role");
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
        const error = new Error("A user with this email could not be found.");
        error.data = { usermessage: "Invalid User Name or Password" };

        error.statusCode = 401;
        next(error);
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        error.data = { usermessage: "Invalid User Name or Password" };
        next(error);
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "somesupersecretsecret",
        { expiresIn: "1h" }
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
        err.data = { usermessage: "Internal Server Error" };
      }
      next(err);
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
  res.status(200).json({
    message: "Authenticated.",
    user_id: userId,
  });
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
        .then((permisiions) => {
          res.status(200).json({
            message: "Fetched permisiions successfully.",
            data: permisiions,
            totalItems: totalItems,
          });
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    } else {
      console.log(hasPermission)
      const error = new Error("Insufficient privilege");
      error.statusCode = 405;
      error.data = {
        error: "Insufficient privilege",
        data: [
          {
            type: "permision",
            msg: "Insufficient privilege.",
            path: req.userId,
            location: "body",
          },
        ],
      };
      next(error);
    }
  });
};
exports.createPermission = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error); // Return here to exit the function after sending the validation error
  }

  hasPermission(req.userId, "createPermission")
    .then((hasPermission) => {
      if (hasPermission) {
        const { name, description, objectname } = req.body; // Use object destructuring
        const permission = new Permission({
          name,
          description,
          objectname,
        });
        return permission.save();
      } else {
        const error = new Error("Insufficient privilege");
        error.statusCode = 405;
        error.data = {
          error: "Insufficient privilege",
          data: [
            {
              type: "permission",
              msg: "Insufficient privilege.",
              path: "userId", // Corrected path to match the error data
              location: "body",
            },
          ],
        };
        throw error; // Throw the error to trigger the catch block
      }
    })
    .then((result) => {
      res.status(201).json({ message: "Permission created!", permission: result });
    })
    .catch((error) => {
      console.error("Error:", error.message);
      next(error); // Pass the error to the error handling middleware
    });
};

// Controller function for handling errors
exports.handleError = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
    data: err.data, // Include error data in the response
  });
};
