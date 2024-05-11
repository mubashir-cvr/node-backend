const { StockTransaction } = require("../models/stockTransaction");

const CrateStockTransaction = (
  item,
  quantity,
  packingType,
  inOrOut,
  epic,
  epicObject,
  epicId,
  updated_user
) => {
  const newStockTransaction = new StockTransaction({
    item,
    quantity,
    packingType,
    inOrOut,
    epic,
    epicObject,
    epicId,
    updated_user,
  });
  return newStockTransaction;
};
module.exports = { CrateStockTransaction };
