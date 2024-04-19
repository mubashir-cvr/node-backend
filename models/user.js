const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true ,
    unique: true,
  },
  password: {
    type: String,
    required: true 
  },
  name: {
    type: String,
    required: true 
  },
  department: {
    type: String,
    default: '' 
  },
  address: {
    type: String,
    default: '' 
  },
  phoneNumber: {
    type: String,
    unique: true,
    default: '' 
  },
  status: {
    type: String,
    default: 'ACTIVE'
  },
  profilePicture: {
    type: String  
  },
  user_type: {
    type: String,
    default: 'staff'
  },
  as_on_date: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: null
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role' 
  }
});

module.exports = mongoose.model('User', userSchema);