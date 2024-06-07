const express = require("express");
const printerController = require("../../controllers/printer");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();
router.post(
  "/",
  isAuth,
  [
    body("name").trim().not().isEmpty(),
    body("printingMaterial").trim().not().isEmpty(),
    body("maxLength").isNumeric().not().isEmpty(),
    body("maxBreadth").isNumeric().not().isEmpty(),
  ],
  printerController.createPrinter
);

// Update Stock Item
router.put(
  "/edit/:printerId",
  isAuth,
  [
    body("name").trim().not().isEmpty(),
    body("printingMaterial").trim().not().isEmpty(),
    body("maxLength").isNumeric().not().isEmpty(),
    body("maxBreadth").isNumeric().not().isEmpty(),
  ],
  printerController.updatePrinter
);

// Delete Stock Item
router.delete(
  "/:printerId",
  isAuth,
  [param("printerId").trim().not().isEmpty()],
  printerController.deletePrinter
);

// Get Stock Items
router.get("/", isAuth, printerController.getPrinters);
router.use(printerController.handleError);
module.exports = router;
