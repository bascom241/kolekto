import mongoose from 'mongoose';
import validator from 'validator';

const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/;

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    select: false
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm password']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide phone number'],
    validate: {
      validator: function(v) {
        return phoneRegex.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpiresDate: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpiresDate: {
    type: Date
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
