const m = require('mongoose'); // 'm' for mongoose
const b = require('bcryptjs'); // 'b' for bcryptjs

// User Schema (Slightly reduced field validation for minification, keeping core structure)
const s = new m.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Min 3 chars'], // Minimized error message
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'] // Minimized error message
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Min 6 chars'] // Minimized error message
  },
  profileImage: { type: String, default: '' },
  dietaryPreferences: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'keto', 'gluten-free', 'dairy-free', 'paleo', 'low-carb', 'pescatarian']
  }],
  savedRecipes: [{ type: m.Schema.Types.ObjectId, ref: 'Recipe' }],
  uploadedRecipes: [{ type: m.Schema.Types.ObjectId, ref: 'Recipe' }],
  followers: [{ type: m.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: m.Schema.Types.ObjectId, ref: 'User' }],
  bio: { type: String, maxlength: 500 },
  location: { type: String, maxlength: 100 },
  website: { type: String, maxlength: 200 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals (Minified names)
s.virtual('rC').get(function() { return this.uploadedRecipes.length; }); // recipesCount
s.virtual('fC').get(function() { return this.followers.length; });      // followersCount
s.virtual('fgC').get(function() { return this.following.length; });     // followingCount

// Indexes
s.index({ email: 1 });
s.index({ username: 1 });
s.index({ createdAt: -1 });

// Pre-save hook: Hash password (Minified to 'n' for next, 'e' for error)
s.pre('save', async function(n) {
  if (!this.isModified('password')) return n();
  try {
    const salt = await b.genSalt(12);
    this.password = await b.hash(this.password, salt);
    n();
  } catch (e) {
    n(e);
  }
});

// Pre-save hook: Update timestamps (original code already handles this implicitly via { timestamps: true }, but keeping the explicit hook structure for minification exercise)
s.pre('save', function(n) {
  this.updatedAt = new Date();
  n();
});

// Method: Compare password (Minified function name and variable)
s.methods.cP = async function(p) { // 'cP' for comparePassword, 'p' for candidatePassword
  try {
    return await b.compare(p, this.password);
  } catch (e) {
    throw e;
  }
};

// Method: Generate password reset token (Minified function name and variables)
s.methods.gPRT = function() { // 'gPRT' for generatePasswordResetToken
  const c = require('crypto'); // 'c' for crypto
  const t = c.randomBytes(32).toString('hex'); // 't' for resetToken
  
  this.resetPasswordToken = c
    .createHash('sha256')
    .update(t)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 600000; // 10 minutes (10 * 60 * 1000)
  
  return t;
};

// Method: Generate email verification token (Minified function name and variables)
s.methods.gEVT = function() { // 'gEVT' for generateEmailVerificationToken
  const c = require('crypto'); // 'c' for crypto
  const v = c.randomBytes(32).toString('hex'); // 'v' for verificationToken
  
  this.emailVerificationToken = c
    .createHash('sha256')
    .update(v)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 86400000; // 24 hours (24 * 60 * 60 * 1000)
  
  return v;
};

// Method: Transform output (Minified function name and variable)
s.methods.toJSON = function() {
  const o = this.toObject(); // 'o' for userObject
  delete o.password;
  delete o.resetPasswordToken;
  delete o.resetPasswordExpires;
  delete o.emailVerificationToken;
  delete o.emailVerificationExpires;
  return o;
};

// Static method: Find by email (Minified function name and variable)
s.statics.fBE = function(e) { // 'fBE' for findByEmail, 'e' for email
  return this.findOne({ email: e.toLowerCase() });
};

// Static method: Find by username (Minified function name and variable)
s.statics.fBU = function(u) { // 'fBU' for findByUsername, 'u' for username
  return this.findOne({ username: new RegExp(`^${u}$`, 'i') });
};

module.exports = m.model('User', s);