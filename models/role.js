const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define Permission Schema
const permissionSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  objectname: {
    type: String
  }
});

// Define Role Schema
const roleSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  permissions: [{
    type: Schema.Types.ObjectId, // Reference to Permission Schema
    ref: 'Permission'
  }]
});

// Define Permission model
const Permission = mongoose.model('Permission', permissionSchema);

// Define Role model
const Role = mongoose.model('Role', roleSchema);

module.exports = {
  Permission,
  Role
};
