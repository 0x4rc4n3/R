// ============================================
// FILE: backend/scripts/createAdmin.js - EXTREME MINIFIED
// ============================================
const m = require('mongoose'); // Renamed mongoose to 'm'
const b = require('bcryptjs'); // Renamed bcryptjs to 'b'
const p = require('path'); // Renamed path to 'p'

// Load environment variables
require('dotenv').config({ path: p.join(__dirname, '..', '.env') });

// console.log('🚀 Starting Admin Creation Script...'); // Minified logs
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe_hub';

// User Schema
const s = new m.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImage: { type: String, default: '' },
  dietaryPreferences: [String],
  savedRecipes: [{ type: m.Schema.Types.ObjectId, ref: 'Recipe' }],
  uploadedRecipes: [{ type: m.Schema.Types.ObjectId, ref: 'Recipe' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

s.pre('save', async function(n) { // 'n' for next
  if (!this.isModified('password')) return n();
  try {
    const salt = await b.genSalt(10);
    this.password = await b.hash(this.password, salt);
    // console.log('🔐 Password hashed successfully');
    n();
  } catch (e) { // 'e' for error
    console.error('❌ Hash error:', e.message);
    n(e);
  }
});

const User = m.model('User', s);

// Connect to MongoDB
async function cDB() { // connectDB
  try {
    // console.log('🔌 Connecting to MongoDB...');
    await m.connect(URI);
    console.log('✅ Connected to MongoDB.');
    return true;
  } catch (e) {
    console.error('❌ DB connection error:', e.message);
    return false;
  }
}

// Create Admin Function
async function cA() { // createAdmin
  const ADMIN_EMAIL = 'admin@recipehub.com';
  const ADMIN_PASS = 'Admin@123456';
  const ADMIN_USER = 'admin';

  try {
    // console.log('\n🔍 Checking for existing admin...');
    
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log(`⚠️ Admin exists: ${existingAdmin.email}`);
      console.log('💡 Default login: E:' + ADMIN_EMAIL + ' P:' + ADMIN_PASS);
      return;
    }

    console.log('📝 Creating new admin...');

    const admin = new User({
      username: ADMIN_USER,
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      role: 'admin',
      isActive: true,
      dietaryPreferences: []
    });

    await admin.save();

    console.log('\n✅ Admin created! (U:' + ADMIN_USER + ', E:' + ADMIN_EMAIL + ', P:' + ADMIN_PASS + ')');
    console.log('⚠️ IMPORTANT: Change the password immediately!');
    
  } catch (e) {
    console.error('\n❌ Admin creation failed:', e.message);
    if (e.code === 11000) console.error('💡 Duplicate key error.');
    throw e;
  }
}

// Main execution
async function main() {
  try {
    if (!(await cDB())) {
      console.error('\n❌ MongoDB not running! Start with: mongod');
      process.exit(1);
    }

    await cA();
    
    // console.log('\n✅ Script completed successfully!');
  } catch (e) {
    console.error('\n❌ Script failed.');
    process.exit(1);
  } finally {
    await m.connection.close();
    // console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
main();