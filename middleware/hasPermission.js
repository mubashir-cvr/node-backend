const User = require('../models/user');
const { Role } = require('../models/role');
const { errorResponse } = require('../Utils/utilities');

const hasPermission = (userId, permissionNames) => {
  return User.findById(userId)
    .populate('role')
    .then(user => {
      if (!user) {
        throw new Error('User not found');
      }

      return Role.findById(user.role._id).populate('permissions');
    })
    .then(role => {
      const hasAllAccess = role.permissions.some(permission => permission.name === 'allAccess');
      if (hasAllAccess) {
        return true; // Grant permission if user has 'allAccess'
      }

      const hasPermissions = permissionNames.some(permissionName =>
        role.permissions.some(permission => permission.name === permissionName)
      );
      return hasPermissions;
    })
    .catch(error => {
      console.error('Error checking permission:', error.message);
      return false;
    });
};

module.exports = {
  hasPermission
};
