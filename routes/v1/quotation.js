const express = require("express");
const quotationController = require("../../controllers/quotation");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();
router.post(
  "/",
  isAuth,
  [
    body("customer").trim().not().isEmpty()
  ],
  quotationController.createQuotation
);


router.put(
  "/edit/:quotationId",
  isAuth,
  [
    body("customer").trim().not().isEmpty()
  ],
  quotationController.updateQuotation
);

router.get(
  "/:quotationId",
  isAuth,
  [param("quotationId").trim().not().isEmpty()],
  quotationController.getQuotationDetails
);

router.post(
  "/add/:quotationId",
  isAuth,
  [
    body("item").not().isEmpty()
  ],
  quotationController.addQuotationItem
);


router.delete(
  "/:quotationId",
  isAuth,
  [param("quotationId").trim().not().isEmpty()],
  quotationController.deleteQuotation
);


router.get("/", isAuth, quotationController.getQuotations);
router.use(quotationController.handleError);
module.exports = router;
