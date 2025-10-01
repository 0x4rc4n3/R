// ============================================
// FILE: backend/scripts/resetAdmin.js - EXTREME MINIFIED
// ============================================
const m = require('mongoose'); // 'm' for mongoose
const b = require('bcryptjs'); // 'b' for bcryptjs
const p = require('path');
require('dotenv').config({ path: p.join(__dirname, '..', '.env') });

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe_hub';
const ADMIN_EMAIL = 'admin@recipehub.com';
const ADMIN_PASS = 'Admin@123456';
const ADMIN_USER = 'admin';

// User Schema (Minified properties, keeping types)
const s = new m.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  dietaryPreferences: [String],
  savedRecipes: [],
  uploadedRecipes: [],
  createdAt: Date
});

s.pre('save', async function(n) { // 'n' for next
  if (!this.isModified('password')) return n();
  try {
    const salt = await b.genSalt(10);
    this.password = await b.hash(this.password, salt);
    n();
  } catch (e) { n(e); }
});

const User = m.model('User', s);

async function rA() { // resetAdmin
  try {
    console.log('🔌 Connecting to MongoDB...');
    await m.connect(URI);
    console.log('✅ Connected!');

    console.log('🗑️ Deleting old admin...');
    const dR = await User.deleteMany({ role: 'admin' }); // deleteResult
    console.log(` Deleted ${dR.deletedCount} admin(s).`);

    console.log('📝 Creating new admin...');
    const admin = new User({
      username: ADMIN_USER,
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      role: 'admin',
      isActive: true,
      dietaryPreferences: [],
      createdAt: new Date()
    });

    await admin.save();
    
    console.log('\n✅ Admin reset complete! Default credentials:');
    console.log(` E: ${ADMIN_EMAIL}`);
    console.log(` P: ${ADMIN_PASS}`);

    await m.connection.close();
    // console.log('🔌 MongoDB connection closed');
    process.exit(0);
  } catch (e) { // 'e' for error
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

rA();