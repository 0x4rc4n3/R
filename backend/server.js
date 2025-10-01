// ============================================
// FILE: backend/server.js - SECURITY HARDENED VERSION
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet'); // Add: npm install helmet
const rateLimit = require('express-rate-limit'); // Add: npm install express-rate-limit

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security: JWT Secret MUST be in environment variable
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET not set in environment variables');
  process.exit(1);
}

const SECRET = process.env.JWT_SECRET;

// Security: Use helmet for HTTP headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb for security
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe_hub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// =====================
// MONGOOSE MODELS
// =====================

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/ // Security: Only alphanumeric and underscore
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 8 // Security: Increased from 6 to 8
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  profileImage: { type: String, default: '' },
  dietaryPreferences: [String],
  savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  uploadedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Security: Use bcrypt with 12 rounds (more secure than 10)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12); // Increased from 10 to 12
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Account lockout after failed attempts
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

const User = mongoose.model('User', userSchema);

// Recipe Schema (simplified for this example)
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['breakfast', 'lunch', 'dinner', 'desserts', 'drinks', 'snacks', 'appetizers']
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Recipe = mongoose.model('Recipe', recipeSchema);

// =====================
// MIDDLEWARE
// =====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any MongoDB operators from user input
  const sanitize = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };
  
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

app.use(sanitizeInput);

// =====================
// AUTH ROUTES
// =====================

// Register - with rate limiting
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, dietaryPreferences = [] } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Username, email, and password are required' 
      });
    }
    
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ 
        message: 'Username must be between 3 and 30 characters' 
      });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        message: 'Username can only contain letters, numbers, and underscores' 
      });
    }
    
    // Security: Stronger password requirement
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long' 
      });
    }
    
    const emailLower = email.toLowerCase().trim();
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email: emailLower }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === emailLower 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }
    
    // Create user
    const user = await new User({ 
      username, 
      email: emailLower, 
      password, 
      dietaryPreferences, 
      role: 'user' 
    }).save();
    
    console.log('✅ User registered:', user.username);
    
    // Security: Shorter token expiration (1 day instead of 7)
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role }, 
      SECRET, 
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        dietaryPreferences: user.dietaryPreferences 
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      message: 'Error registering user', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login - with rate limiting and account lockout
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const emailLower = email.toLowerCase().trim();
    console.log('🔐 Login attempt for:', emailLower);
    
    const user = await User.findOne({ email: emailLower });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    const isValid = await user.comparePassword(password);
    
    if (!isValid) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      await user.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
      });
    }
    
    // Security: Shorter token expiration
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role }, 
      SECRET, 
      { expiresIn: '1d' }
    );
    
    console.log('✅ Login successful:', user.username);
    
    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        dietaryPreferences: user.dietaryPreferences 
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -loginAttempts -lockUntil')
      .populate('savedRecipes uploadedRecipes');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =====================
// ERROR HANDLING
// =====================

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// =====================
// START SERVER
// =====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security features enabled: Helmet, Rate Limiting, Account Lockout`);
});