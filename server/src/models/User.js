/*
 * DESIGN PATTERN: MVC — Model Layer (Pattern #1)
 *
 * Mongoose discriminators let three document types (Patient, Doctor, Admin) share
 * a single "users" collection while each having their own schema fields.
 * Querying User.find() returns all users; Doctor.find() automatically filters
 * to doctor documents only.
 *
 * Why discriminators over separate collections: a single email index enforces
 * uniqueness across all roles, and a single JWT/auth flow works for every role.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const IRISH_COUNTIES = [
  'Carlow','Cavan','Clare','Cork','Donegal','Dublin','Galway','Kerry',
  'Kildare','Kilkenny','Laois','Leitrim','Limerick','Longford','Louth',
  'Mayo','Meath','Monaghan','Offaly','Roscommon','Sligo','Tipperary',
  'Waterford','Westmeath','Wexford','Wicklow','Antrim','Armagh','Down',
  'Fermanagh','Londonderry','Tyrone',
];

// ── Base User Schema ──────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false means passwordHash is NEVER returned in query results by default.
    // Callers must explicitly opt-in with .select('+passwordHash').
    passwordHash: { type: String, select: false },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    language: { type: String, enum: ['en', 'ga'], default: 'en' },
    // sparse: true allows multiple null values (users without Google) while
    // still enforcing uniqueness among non-null googleIds.
    googleId: { type: String, sparse: true },
    active: { type: Boolean, default: true },
  },
  {
    discriminatorKey: 'role', // 'role' field is automatically set per discriminator
    timestamps: true,
  }
);

// Compare a plain-text password against the stored bcrypt hash.
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Strip sensitive fields before sending to the client.
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

// ── Patient ───────────────────────────────────────────────────────────────────
const Patient = User.discriminator(
  'patient',
  new Schema({
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    county: { type: String, enum: IRISH_COUNTIES },
    phone: { type: String, trim: true },
  })
);

// ── Doctor ────────────────────────────────────────────────────────────────────
const Doctor = User.discriminator(
  'doctor',
  new Schema({
    licenseNumber: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    // Admin must set verified=true before a doctor can log in.
    verified: { type: Boolean, default: false },
    availability: [
      {
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        slots: [{ type: String }],
      },
    ],
  })
);

// ── Admin ─────────────────────────────────────────────────────────────────────
const Admin = User.discriminator(
  'admin',
  new Schema({
    department: { type: String, trim: true },
  })
);

module.exports = { User, Patient, Doctor, Admin, IRISH_COUNTIES };
