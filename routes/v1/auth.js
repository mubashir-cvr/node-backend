const express = require("express");
const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const User = require("../../models/user");
const { Permission, Role } = require("../../models/role");
const authController = require("../../controllers/auth");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/profiles");
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${uuidv4()}-${new Date().toISOString()}.${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter }).single(
  "profilePicture"
);

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error." });
      } else if (err) {
        return res.status(500).json({ message: "Internal server error." });
      }

      next();
    });
  },
  authController.signup
);

router.post("/login", authController.login);
router.get("/checkauth", isAuth, authController.checkAuth);
router.post(
  "/permissions",
  isAuth,
  [
    body("name")
      .trim()
      .not()
      .isEmpty()
      .custom((value, { req }) => {
        return Permission.findOne({ name: value }).then((permDoc) => {
          if (permDoc) {
            return Promise.reject("Duplicate Permission");
          }
        });
      }),
    body("description").trim().not().isEmpty(),
    body("objectname").trim().not().isEmpty(),
  ],
  authController.createPermission
);
router.get("/permissions", isAuth, authController.getPermissions);
router.delete(
  "/permissions/:permissionId",
  isAuth,
  authController.deletePermission
);
router.post(
  "/roles",
  isAuth,
  [body("name").trim().not().isEmpty(), body("permissions").isArray()],
  authController.createRole
);
router.put(
  "/roles/:roleId",
  isAuth,
  [
    param("roleId").trim().not().isEmpty(),
    body("name").trim().not().isEmpty(),
    body("permissions").isArray(),
  ],
  authController.updateRole
);

router.delete(
  "/roles/:roleId",
  isAuth,
  [param("roleId").trim().not().isEmpty()],
  authController.deleteRole
);

router.get("/roles", isAuth, authController.getRoles);

// Route to create a new user
router.post(
  "/users",
  isAuth,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error." });
      } else if (err) {
        return res.status(500).json({ message: "Internal server error." });
      }
      next();
    });
  },
  [
    body("email")
      .isEmail()
      .withMessage("Not valid email")
      .normalizeEmail()
      .custom(async (value, { req }) => {
        if (value) {
          const existingUser = await User.findOne({ email: value });
          if (existingUser) {
            throw new Error("Email alredy registered");
          }
        }
        return true;
      }),
    body("password").isLength({ min: 6 }).withMessage("Minimum 6 charectors"),
    body("name").trim().not().isEmpty(),
    body("department").optional().trim(),
    body("address").optional().trim(),
    body("role").not().isEmpty(),
    body("phoneNumber")
      .isMobilePhone()
      .withMessage("Not Valid Phone Number")
      .trim()
      .custom(async (value, { req }) => {
        if (value) {
          const existingUser = await User.findOne({ phoneNumber: value });
          if (
            existingUser &&
            existingUser._id.toString() !== req.params.userId
          ) {
            throw new Error(
              "Phone number is already associated with another user"
            );
          }
        }
        return true;
      }),
    body("status")
      .optional()
      .isIn(["NEW", "ACTIVE", "INACTIVE"])
      .withMessage("Accepted NEW/ACTIVE/INACTIVE"),
    body("user_type")
      .isIn(["STAFF", "ADMIN", "MANAGEMENT"])
      .withMessage("Accepted STAFF,ADMIN"),
    body("profilePicture").optional().isString(), // Assuming profilePicture is optional
  ],
  isAuth,
  authController.createUser
);

// Route to update an existing user
router.put(
  "/users/:userId",
  isAuth,
  upload,
  [
    param("userId").trim().not().isEmpty(),
    body("email").optional().isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 6 }),
    body("name").trim().not().isEmpty(),
    body("department").optional().trim(),
    body("address").optional().trim(),
    body("phoneNumber")
      .isMobilePhone()
      .withMessage("Not Valid Phone Number")
      .trim()
      .custom(async (value, { req }) => {
        if (value) {
          const existingUser = await User.findOne({ phoneNumber: value });
          if (
            existingUser &&
            existingUser._id.toString() !== req.params.userId
          ) {
            throw new Error(
              "Phone number is already associated with another user"
            );
          }
        }
        return true;
      }),
    body("status")
      .optional()
      .isIn(["NEW", "ACTIVE", "INACTIVE"])
      .withMessage("Accepted NEW/ACTIVE/INACTIVE"),
    body("user_type").optional().isIn(["STAFF", "ADMIN"]),
    body("profilePicture").optional().isString(), // Assuming profilePicture is optional
  ],
  isAuth,
  authController.updateUser
);

// Route to delete a user
router.delete(
  "/users/:userId",
  [param("userId").trim().not().isEmpty()],
  isAuth,
  authController.deleteUser
);

// Route to get all users
router.get("/users", isAuth, authController.getUsers);

router.use(authController.handleError);

module.exports = router;
