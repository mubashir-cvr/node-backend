const express = require("express");
const stockController = require("../../controllers/stocks");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();

router.get(
  "/",
  isAuth,
  stockController.getStocks
);
router.post(
  "/",
  isAuth,
  [
    body("item").trim().not().isEmpty().withMessage("No Item Selected"),
    body("quantity")
      .isNumeric()
      .not()
      .isEmpty()
      .withMessage("Please enter Quantity"),
    body("amount").isNumeric().optional(),
  ],
  stockController.createStock
);

router.use(stockController.handleError);
module.exports = router;
