const express = require('express');
const { body } = require('express-validator');
const isAuth = require('../../middleware/is-auth');
const User = require('../../models/user');
const authController = require('../../controllers/auth');
const multer = require('multer');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'profile');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter }).single('profilePicture');

const router = express.Router();

router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists!');
          }
        });
      })
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 5 }),
    body('name')
      .trim()
      .not()
      .isEmpty()
  ],
  (req, res, next) => {
    upload(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error.' });
      } else if (err) {
        return res.status(500).json({ message: 'Internal server error.' });
      }

      next();
    });
  },
  authController.signup
);

router.post('/login', authController.login);
router.get('/checkauth', isAuth,authController.checkAuth);
router.use(authController.handleError);

module.exports = router;
