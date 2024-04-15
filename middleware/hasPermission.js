const User = require('../models/user');
const {Role} =require('../models/role')

const hasPermission = async (userId, permissionName) => {
  try {
    const user = await User.findById(userId).populate('role');
    if (!user) {
      throw new Error('User not found');
    }

    const role = await Role.findById(user.role._id).populate('permissions');
    const hasPermission = role.permissions.some(permission => permissionName === permission.name || 'allAccess' === permission.name);

    return hasPermission;
  } catch (error) {
    console.error('Error checking permission:', error.message);
    return false;
  }
};

module.exports = {
  hasPermission
};