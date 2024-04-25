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
  User.findById(userId)
    .populate("role") // Assuming "role" is the field in the User model referencing the Role model
    .then((user) => {
      // Check if the user has a role
      if (!user || !user.role) {
        throw new Error("User role not found.");
      }

      // Extract permission IDs from the role
      const permissionIds = user.role.permissions;

      // Fetch the names of permissions based on the IDs
      Permission.find({ _id: { $in: permissionIds } })
        .then((permissions) => {
          const permissionNames = permissions.map(
            (permission) => permission.name
          );
          const permissionObjects = Array.from(
            new Set(permissions.map((permission) => permission.objectname))
          );

          const responseData = generateResponse(
            201,
            "Authenticated.",
            {
              user: user,
              permissions: {
                permissions: permissionNames,
                objects: permissionObjects,
              },
            }, // Combine user and permission names in the response
            {}
          );
          res.status(200).json(responseData);
        })
        .catch((error) => {
          throw new Error("Error fetching permissions.");
        });
    })
    .catch((error) => {
      // Handle errors
      console.error("Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    });
};

exports.getPermissions = (req, res, next) => {
  const currentPage = parseInt(req.query.page) || 1;
  const perPage = 20;
  const searchQuery = req.query.search || "";

  let totalItems;

  hasPermission(req.userId, ["readPermission"]).then((hasPermission) => {
    if (hasPermission) {
      let query = {};
      if (searchQuery) {
        query = {
          $or: [
            { name: { $regex: new RegExp(searchQuery, "i") } },
            { description: { $regex: new RegExp(searchQuery, "i") } },
          ],
        };
      }

      Permission.find(query)
        .countDocuments()
        .then((count) => {
          totalItems = count;
          return Permission.find(query)
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        })
        .then((permissions) => {
          let responseData = generateResponse(
            200,
            "Fetched permissions successfully.",
            permissions,
            {
              totalItems: totalItems,
              currentPage: currentPage,
              totalPages: Math.ceil(totalItems / perPage),
              nextPage:
                currentPage < Math.ceil(totalItems / perPage)
                  ? currentPage + 1
                  : null,
              prevPage: currentPage > 1 ? currentPage - 1 : null,
            }
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
        if (
          !hasPermission ||
          role.name === "superAdmin" ||
          role.name === "adminAccess"
        ) {
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
      User.findById(req.userId).then((user) => {
        let filteredRoles = roles;
        if (user.email !== "superadmin@gmail.com") {
          filteredRoles = roles.filter((role) => role.name !== "superAdmin");
        }
        const responseData = generateResponse(
          200,
          "Roles Retrieved",
          filteredRoles,
          {}
        );
        res.status(200).json(responseData);
      });
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

        // Construct the update object without password
        let updateObject = {
          email,
          name,
          department,
          address,
          phoneNumber,
          status,
          user_type,
          role,
        };

        // If a new profile picture is uploaded, update the profilePicture field
        if (req.file) {
          updateObject.profilePicture = req.file.path; // Assuming req.file.path contains the path to the uploaded image
        } else {
          // Use the existing profile picture if no new picture is uploaded
          updateObject.profilePicture = user.profilePicture;
        }

        // Update the user with the new data
        return User.findByIdAndUpdate(userId, updateObject, { new: true }).then(
          (updatedUser) => {
            // If a new profile picture is provided and the user update is successful
            if (req.file && updatedUser && user.profilePicture) {
              // Remove the old profile picture from the server
              const oldProfilePicture = user.profilePicture;
              const imagePath = path.join(__dirname, "..", oldProfilePicture);
              fs.unlink(imagePath, (err) => {
                if (err) {
                  console.error("Error deleting old profile picture:", err);
                } else {
                  console.log("Old profile picture deleted successfully");
                }
              });
            }

            return updatedUser;
          }
        );
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

// Delete an existing user// Delete an existing user
exports.deleteUser = (req, res, next) => {
  const userId = req.params.userId;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        const response = errorResponse(404, "User not found", []);
        return res.status(404).json(response);
      }

      // Check if user is superadmin or trying to delete themselves
      if (user.email === "superadmin@gmail.com" || req.userId === userId) {
        const error = errorResponse(405, "Not Allowed to delete", {});
        return Promise.reject(error); // Reject the promise to skip further execution
      }

      // Check permission to delete user
      return hasPermission(req.userId, ["deleteUser"]).then((canDeleteUser) => {
        if (!canDeleteUser) {
          const response = errorResponse(405, "Insufficient privilege", []);
          return res.status(405).json(response);
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
        });
      });
    })
    .catch((error) => {
      next(error); // Pass the error to the error handling middleware
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
      const { search, page } = req.query;
      const pageNumber = parseInt(page) || 1;
      const perPage = 25;
      const skip = (pageNumber - 1) * perPage;

      let query = {};
      if (search) {
        query = {
          $or: [
            { name: { $regex: new RegExp(search, "i") } },
            { phoneNumber: { $regex: new RegExp(search, "i") } },
            { email: { $regex: new RegExp(search, "i") } },
          ],
        };
      }

      return Promise.all([
        User.find(query).skip(skip).limit(perPage).populate("role"),
        User.countDocuments(query),
        pageNumber,
        perPage,
      ]);
    })
    .then(([users, totalUsers, pageNumber, perPage]) => {
      User.findById(req.userId).then((user) => {
        let filteredUsers = users;
        if (user.email !== "superadmin@gmail.com") {
          filteredUsers = users.filter(
            (user) => user.email !== "superadmin@gmail.com"
          );
        }
        const responseData = generateResponse(
          200,
          "Users Retrieved",
          filteredUsers,
          {
            totalUsers,
            nextPage:
            pageNumber < Math.ceil(totalUsers / perPage)
                ? currentPage + 1
                : null,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalUsers / perPage),
          }
        );
        res.status(200).json(responseData);
      });
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      next(response);
    });
};

exports.resetPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = errorResponse(422, "Validation Failed", errors.array());
    return next(response);
  }

  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        const response = errorResponse(404, "User not found", []);
        return Promise.reject(response);
      }
      return bcrypt.compare(oldPassword, user.password);
    })
    .then((isMatch) => {
      if (!isMatch) {
        const response = errorResponse(401, "Invalid old password", []);
        return Promise.reject(response);
      }
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      return User.findByIdAndUpdate(userId, { password: hashedPassword });
    })
    .then(() => {
      const responseData = generateResponse(
        200,
        "Password reset successful",
        {},
        {}
      );
      res.status(200).json(responseData);
    })
    .catch((error) => {
      const response = errorResponse(500, error.message, []);
      return next(response);
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
