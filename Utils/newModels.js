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
    ],
  };
};

const modelSyncKey = false;

module.exports = {
  getAllModels,
  modelSyncKey,
};
