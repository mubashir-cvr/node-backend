const express = require("express");
const customerController = require("../../controllers/customer");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const { Customer } = require("../../models/customer");
const router = express.Router();
router.post(
  "/",
  isAuth,
  [
    body("name").trim().not().isEmpty(),
    body("phoneNumber")
      .isMobilePhone()
      .withMessage("Not Valid Phone Number")
      .trim()
      .custom(async (value, { req }) => {
        if (value) {
          const existingCustomer = await Customer.findOne({
            phoneNumber: value,
          });
          if (existingCustomer) {
            throw new Error(
              "Phone number is already associated with another customer"
            );
          }
        }
        return true;
      }),
  ],
  customerController.createCustomer
);

// Update Stock Item
router.put(
  "/edit/:customerId",
  isAuth,
  [
    body("name").trim().not().isEmpty(),
    body("phoneNumber")
      .isMobilePhone()
      .withMessage("Not Valid Phone Number")
      .trim()
      .custom(async (value, { req }) => {
        if (value) {
          const existingCustomer = await Customer.findOne({
            phoneNumber: value,
          });
          if (existingCustomer &&   existingCustomer._id.toString() !== req.params.customerId) {
            throw new Error(
              "Phone number is already associated with another customer"
            );
          }
        }
        return true;
      }),
  ],
  customerController.updateCustomer
);

// Delete Stock Item
router.delete(
  "/:customerId",
  isAuth,
  [param("customerId").trim().not().isEmpty()],
  customerController.deleteCustomer
);

// Get Stock Items
router.get("/", isAuth, customerController.getCustomers);
router.use(customerController.handleError);
module.exports = router;
