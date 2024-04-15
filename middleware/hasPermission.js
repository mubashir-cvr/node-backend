const User = require('../models/user');
const { Role } = require('../models/role');

const hasPermission = (userId, permissionName) => {
  return User.findById(userId)
    .populate('role')
    .then(user => {
      if (!user) {
        throw new Error('User not found');
      }

      return Role.findById(user.role._id).populate('permissions');
    })
    .then(role => {
      const hasPermission = role.permissions.some(permission => permissionName === permission.name || 'allAccess' === permission.name);
      return hasPermission;
    })
    .catch(error => {
      console.error('Error checking permission:', error.message);
      return false;
    });
};

module.exports = {
  hasPermission
};
