const express = require("express");
const pageSizeController = require("../../controllers/pageSize");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();
router.post(
  "/",
  isAuth,
  [
    body("name").trim().not().isEmpty(),
    body("dimention_length").isNumeric().not().isEmpty(),
    body("dimention_breadth").isNumeric().not().isEmpty()
  ],
  pageSizeController.createPageSize
);

// Update Stock Item
router.put(
  "/edit/:pageSizeId",
  isAuth,
  [
    body("name").trim().not().isEmpty(),
    body("dimention_length").isNumeric().not().isEmpty(),
    body("dimention_breadth").isNumeric().not().isEmpty()
  ],
  pageSizeController.updatePageSize
);

// Delete Stock Item
router.delete(
  "/:pageSizeId",
  isAuth,
  [param("pageSizeId").trim().not().isEmpty()],
  pageSizeController.deletePageSize
);

// Get Stock Items
router.get("/", isAuth, pageSizeController.getPageSizes);
router.use(pageSizeController.handleError);
module.exports = router;
