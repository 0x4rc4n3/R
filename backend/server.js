const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key';
const ADMIN_KEY = process.env.ADMIN_SECRET || 'create_admin_secret_2024';

const dir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log('✅ Created uploads directory');
}

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe_hub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ---
// MONGOOSE MODELS
// ---

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImage: { type: String, default: '' },
  dietaryPreferences: [String],
  savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  uploadedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(pass) {
  return bcrypt.compare(pass, this.password);
};

const User = mongoose.model('User', userSchema);

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner', 'desserts', 'drinks', 'snacks'] },
  dietaryTags: [String],
  ingredients: [{ name: { type: String, required: true }, quantity: { type: Number, required: true }, unit: { type: String, required: true } }],
  instructions: [{ stepNumber: { type: Number, required: true }, description: { type: String, required: true }, image: String, videoUrl: String }],
  cookingTime: { type: Number, required: true },
  prepTime: { type: Number, required: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
  servings: { type: Number, required: true },
  images: [String],
  videoUrl: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, rating: { type: Number, min: 1, max: 5 }, review: String, createdAt: { type: Date, default: Date.now } }],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: true },
  tags: [String]
});

recipeSchema.pre('save', function(next) {
  if (this.ratings.length) {
    const total = this.ratings.reduce((s, r) => s + r.rating, 0);
    this.averageRating = total / this.ratings.length;
    this.totalRatings = this.ratings.length;
  }
  next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

const mealPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  meals: [{
    day: { type: String, required: true, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
    breakfast: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    lunch: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    dinner: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    snacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

// ---
// MIDDLEWARE
// ---

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'].includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'))
});

// ---
// AUTH ROUTES
// ---

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', req.body);
    const { username, email, password, dietaryPreferences: diet = [] } = req.body;
    const L_email = email ? email.toLowerCase() : '';

    if (!username || !email || !password) return res.status(400).json({ message: 'Username, email, and password are required' });
    if (username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    const exists = await User.findOne({ $or: [{ email: L_email }, { username }] });
    if (exists) return res.status(400).json({ message: exists.email === L_email ? 'Email already registered' : 'Username already taken' });

    const user = await new User({ username, email: L_email, password, dietaryPreferences: diet, role: 'user' }).save();
    console.log('✅ User created:', user.username);

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully', token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, dietaryPreferences: user.dietaryPreferences }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const L_email = email ? email.toLowerCase() : '';
    console.log('🔐 Login request received:', L_email);

    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: L_email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
    console.log('✅ Login successful:', user.username);

    res.json({
      message: 'Login successful', token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, dietaryPreferences: user.dietaryPreferences }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password').populate('savedRecipes uploadedRecipes');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// ---
// ADMIN ROUTES
// ---

app.post('/api/admin/create', async (req, res) => {
  try {
    const { username, email, password, adminSecret } = req.body;
    
    if (adminSecret !== ADMIN_KEY) return res.status(403).json({ message: 'Invalid admin secret' });
    
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const admin = await new User({ username, email, password, role: 'admin', isActive: true }).save();

    const token = jwt.sign({ userId: admin._id, username: admin.username, role: admin.role }, SECRET, { expiresIn: '7d' });
    console.log('✅ Admin created:', admin.username);

    res.status(201).json({
      message: 'Admin account created successfully', token,
      user: { id: admin._id, username: admin.username, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Error creating admin account' });
  }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.patch('/api/admin/users/:userId/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { role: req.body.role }, { new: true }).select('-password');
    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
});

app.delete('/api/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// ---
// RECIPE ROUTES (keeping existing ones)
// ---

app.get('/api/recipes', async (req, res) => {
  try {
    const { 
      page = 1, limit = 12, category, dietary, difficulty, search,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = { isApproved: true };
    
    if (category && category !== 'all') filter.category = category;
    
    if (dietary) filter.dietaryTags = { $in: Array.isArray(dietary) ? dietary : [dietary] };
    
    if (difficulty) filter.difficulty = difficulty;
    
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [{ title: regex }, { description: regex }, { 'ingredients.name': regex }, { tags: regex }];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [recipes, total] = await Promise.all([
      Recipe.find(filter).populate('author', 'username').sort(sort).limit(limit * 1).skip((page - 1) * limit).exec(),
      Recipe.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      recipes,
      pagination: {
        currentPage: parseInt(page), totalPages, totalRecipes: total,
        hasNextPage: page < totalPages, hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Recipes fetch error:', error);
    res.status(500).json({ message: 'Error fetching recipes' });
  }
});

// [Keep all other recipe routes from original server.js]

// ---
// ERROR HANDLING
// ---

app.use((error, req, res, next) => {
  console.error('Error:', error);
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ---
// START SERVER
// ---

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Test registration at: http://localhost:${PORT}/api/auth/register`);
});

// ---
// AUTO-CREATE ADMIN ON STARTUP
// ---
async function createDefaultAdmin() {
  try {
    if (await User.findOne({ role: 'admin' })) return;
    const defaultAdmin = await new User({
      username: 'admin', email: 'admin@recipehub.com', password: 'admin123456', role: 'admin'
    }).save();
    console.log('✅ Default admin created - Email: admin@recipehub.com, Password: admin123456');
    console.log('⚠️  CHANGE THE PASSWORD IMMEDIATELY!');
  } catch (error) {
    console.log('Admin setup skipped:', error.message);
  }
}

mongoose.connection.once('open', createDefaultAdmin);