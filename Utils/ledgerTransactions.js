const { Ledger } = require("../models/stockLedger");

const CreateLedger = (
  item,
  description,
  inOrOut,
  amount,
  epic,
  epicObject,
  epicId,
  updated_user
) => {
  const newLedger = new Ledger({
    item,
    description,
    inOrOut,
    amount,
    epic,
    epicObject,
    epicId,
    updated_user,
  });
  return newLedger
};

const UpdateLedger = (
  ledgerId,
  description,
  inOrOut,
  amount,
  epic,
  epicObject,
  epicId,
  updated_user
) => {
  Ledger.findById(ledgerId).then((ledger) => {
    console.log(ledger)
    ledger.description = description;
    ledger.inOrOut = inOrOut;
    ledger.amount = amount;
    ledger.epic = epic;
    ledger.epicObject = epicObject;
    ledger.epicId = epicId;
    ledger.updated_user = updated_user;
    return ledger.save();
  });
};

module.exports = { CreateLedger, UpdateLedger };
