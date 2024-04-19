const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
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

exports.checkAuth = (req, res, next) => {
  const userId = req.userId;
  let responseData = generateResponse(
    201,
    "Authenticated.",
    [{ user_id: userId }],
    {}
  );
  res.status(200).json(responseData);
};

exports.getPermissions = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 50;
  let totalItems;
  hasPermission(req.userId, ["readPermission"]).then((hasPermission) => {
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
            permissions,
            { totalItems: totalItems, nextPage: currentPage + 1 }
          );
          res.status(200).json(responseData);
        })
        .catch((err) => {
          let response = errorResponse(500, err.message, []);
          return next(response);
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
exports.createPermission = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  hasPermission(req.userId, ["createPermission"])
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
        result,
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
  hasPermission(req.userId, ["allAccess"]).then((hasPermission) => {
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
                deletedPermission,
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

exports.createRole = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before creating a role
  hasPermission(req.userId, ["createRole"])
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
        return next(response);
      }

      const { name, permissions } = req.body;
      const role = new Role({
        name,
        permissions,
      });
      return role.save();
    })
    .then((role) => {
      return Role.findById(role._id).populate("permissions");
    })
    .then((result) => {
      const responseData = generateResponse(201, "Role Created", result, {});
      res.status(201).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};
exports.updateRole = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const roleId = req.params.roleId;
  const { name, permissions } = req.body;

  Role.findById(roleId)
    .then((role) => {
      if (!role) {
        const response = errorResponse(404, "Role not found", []);
        return Promise.reject(response);
      }
      return role;
    })
    .then((role) => {
      return hasPermission(req.userId, ["updateRole"]).then((hasPermission) => {
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
        return role;
      });
    })
    .then((role) => {
      role.name = name;
      role.permissions = permissions;
      return role.save();
    })
    .then((role) => {
      return Role.findById(role._id).populate("permissions");
    })
    .then((updatedRole) => {
      const responseData = generateResponse(
        200,
        "Role Updated",
        updatedRole,
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.deleteRole = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const roleId = req.params.roleId;

  Role.findById(roleId)
    .then((role) => {
      if (!role) {
        const response = errorResponse(404, "Role not found", []);
        return Promise.reject(response);
      }
      // Check permission before deleting the role
      return hasPermission(req.userId, ["deleteRole"]).then((hasPermission) => {
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
        return Role.findByIdAndDelete(roleId);
      });
    })
    .then((result) => {
      const responseData = generateResponse(200, "Role Deleted", result, {});
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

exports.getRoles = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  // Check permission before listing roles
  hasPermission(req.userId, ["getRoles"])
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
      return Role.find().populate("permissions");
    })
    .then((roles) => {
      const responseData = generateResponse(200, "Roles Retrieved", roles, {});
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
    });
};

// USER CONTROLLER START
exports.createUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Failed to delete profile picture:", err);
        }
      });
    }
    const response = errorResponse(422, "Validation Failed", errors.array());
    return res.status(422).json(response);
  }

  hasPermission(req.userId, ["createUser"])
    .then((canCreateUser) => {

      if (!canCreateUser) {
        const response = errorResponse(405, "Insufficient privilege", []);
        throw response;
      }

      const {
        email,
        password,
        name,
        department,
        address,
        phoneNumber,
        status,
        user_type,
        role,
      } = req.body;

      // Extract the file path or URL from req.file
      const profilePicture = req.file ? req.file.path : null;

      return bcrypt.hash(password, 12).then((hashedPassword) => {
        const user = new User({
          email,
          password: hashedPassword,
          name,
          department,
          address,
          phoneNumber,
          status,
          profilePicture,
          user_type,
          role,
        });
        return user.save();
      });
    })
    .then((newUser) => {
      User.findById(newUser._id)
        .populate("role")
        .then((createdUser) => {
          const responseData = generateResponse(
            201,
            "User Created",
            createdUser,
            {}
          );
          res.status(201).json(responseData);
        });
    })
    .catch((error) => {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Failed to delete profile picture:", err);
          }
        });
      }
      const response = errorResponse(500, error.message, []);
      next(response);
    });
};

// Update an existing user
exports.updateUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return res.status(422).json(response);
  }

  const userId = req.params.userId;
  const {
    email,
    password,
    name,
    department,
    address,
    phoneNumber,
    status,
    user_type,
    role,
  } = req.body;

  hasPermission(req.userId, ["updateUser"])
    .then((canUpdateUser) => {
      if (!canUpdateUser) {
        const response = errorResponse(405, "Insufficient privilege", []);
        return res.status(405).json(response);
      }

      // Find the user to get the old profile picture filename
      return User.findById(userId).then((user) => {
        if (!user) {
          const response = errorResponse(404, "User not found", []);
          return res.status(404).json(response);
        }

        // Update the user with the new data
        return User.findByIdAndUpdate(
          userId,
          {
            email,
            password,
            name,
            department,
            address,
            phoneNumber,
            status,
            profilePicture: user.profilePicture, // Use the new filename if a new picture is uploaded
            user_type,
            role,
          },
          { new: true }
        ).then((updatedUser) => {
          // If a new profile picture is provided and the user update is successful
          if (req.file && updatedUser) {
            // Remove the old profile picture from the server
            const oldProfilePicture = user.profilePicture;
            if (oldProfilePicture) {
              const imagePath = path.join(__dirname, "..", oldProfilePicture);
              fs.unlink(imagePath, (err) => {
                if (err) {
                  console.error("Error deleting old profile picture:", err);
                } else {
                  console.log("Old profile picture deleted successfully");
                }
              });
            }
          }

          return updatedUser;
        });
      });
    })
    .then((user) => {
      if (!user) {
        const response = errorResponse(404, "User not found", []);
        return res.status(404).json(response);
      }
      User.findById(user._id)
        .populate("role")
        .then((updatedUser) => {
          const responseData = generateResponse(
            200,
            "User Updated",
            updatedUser,
            {}
          );
          res.status(200).json(responseData);
        });
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      next(response);
    });
};

// Delete an existing user
exports.deleteUser = (req, res, next) => {
  const userId = req.params.userId;

  hasPermission(req.userId, ["deleteUser"])
    .then((canDeleteUser) => {
      if (!canDeleteUser) {
        const response = errorResponse(405, "Insufficient privilege", []);
        return res.status(405).json(response);
      }

      // Find the user by ID to get the profile picture filename
      return User.findById(userId);
    })
    .then((user) => {
      if (!user) {
        const response = errorResponse(404, "User not found", []);
        return res.status(404).json(response);
      }

      // Delete the user from the database
      return User.findByIdAndDelete(userId).then((deletedUser) => {
        if (deletedUser.profilePicture) {
          const imagePath = path.join(
            __dirname,
            "..",
            deletedUser.profilePicture
          );
          fs.unlink(imagePath, (err) => {
            if (err) {
              const response = errorResponse(500, err, []);
              console.error("Error deleting profile picture:", err);

              return next(response);
            } else {
              console.log("Profile picture deleted successfully");
            }
          });
        }
        const responseData = generateResponse(
          200,
          "User Deleted",
          deletedUser,
          {}
        );
        res.status(200).json(responseData);

        // Remove the profile picture file from the server
      });
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      next(response);
    });
};

// Get all users
exports.getUsers = (req, res, next) => {
  hasPermission(req.userId, ["getUsers"])
    .then((canGetUsers) => {
      if (!canGetUsers) {
        const response = errorResponse(405, "Insufficient privilege", []);
        return res.status(405).json(response);
      }

      return User.find().populate("role");
    })
    .then((users) => {
      const responseData = generateResponse(200, "Users Retrieved", users, {});
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      next(response);
    });
};

// USER CONTROLLER END

// Controller function for handling errors
exports.handleError = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    statusCode: err.statusCode,
    message: err.message || "Internal Server Error",
    data: err.data,
  });
};
