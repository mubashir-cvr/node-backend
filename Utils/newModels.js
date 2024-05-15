const getAllModels = () => {
  return {
    User: [
      { name: "readUser", description: "Read access" },
      { name: "createUser", description: "Create access" },
      { name: "updateUser", description: "Update access" },
      { name: "deleteUser", description: "Delete Access" },
      { name: "allAccessToUser", description: "All access" },
    ],
    Role: [
      { name: "readRole", description: "Read access" },
      { name: "createRole", description: "Create access" },
      { name: "updateRole", description: "Update access" },
      { name: "deleteRole", description: "Delete Access" },
      { name: "allAccessToRole", description: "All access" },
    ], Stock: [
        { name: "readStock", description: "Read access" },
        { name: "createStock", description: "Create access" },
        { name: "updateStock", description: "Update access" },
        { name: "deleteStock", description: "Delete Access" },
        { name: "allAccessToStock", description: "All access" },
      ],
      StockItem: [
        { name: "readStockItem", description: "Read access" },
        { name: "createStockItem", description: "Create access" },
        { name: "updateStockItem", description: "Update access" },
        { name: "deleteStockItem", description: "Delete Access" },
        { name: "allAccessToStockItem", description: "All access" },
      ],
      StockLedger: [
        { name: "readStockLedger", description: "Read access" },
        { name: "createStockLedger", description: "Create access" },
        { name: "updateStockLedger", description: "Update access" },
        { name: "deleteStockLedger", description: "Delete Access" },
        { name: "allAccessToStockLedger", description: "All access" },
      ],
      Customer: [
        { name: "readCustomer", description: "Read access" },
        { name: "createCustomer", description: "Create access" },
        { name: "updateCustomer", description: "Update access" },
        { name: "deleteCustomer", description: "Delete Access" },
        { name: "allAccessToCustomer", description: "All access" },
      ],
      PageSize: [
        { name: "readPageSize", description: "Read access" },
        { name: "createPageSize", description: "Create access" },
        { name: "updatePageSize", description: "Update access" },
        { name: "deletePageSize", description: "Delete Access" },
        { name: "allAccessToPageSize", description: "All access" },
      ],
      Printer: [
        { name: "readPrinter", description: "Read access" },
        { name: "createPrinter", description: "Create access" },
        { name: "updatePrinter", description: "Update access" },
        { name: "deletePrinter", description: "Delete Access" },
        { name: "allAccessToPrinter", description: "All access" },
      ]
  };
};

const modelSyncKey = false;

module.exports = {
  getAllModels,
  modelSyncKey,
};
