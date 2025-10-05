const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zip: { type: String, default: '' },
  },
  { _id: false }
);

const preferencesSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    // Server-side vault passphrase hash (bcrypt)
    vaultPassHash: { type: String, default: '' },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: addressSchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    zkpPublicKey: {
      type: String,
      default: '',
    },
    phone: { type: String, default: '' },
    address: { type: addressSchema, default: () => ({}) },
    company: { type: companySchema, default: () => ({}) },
    preferences: { type: preferencesSchema, default: () => ({}) },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
