// ============================================
// FILE: Recipe Model Schema - EXTREME MINIFIED
// ============================================
const m = require('mongoose'); // 'm' for mongoose

const R = new m.Schema({ // 'R' for Recipe Schema
  title: {
    type: String,
    required: [true, 'Title req'], // Minified error message
    trim: true,
    minlength: [3],
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Desc req'],
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: [true, 'Cat req'],
    enum: {
      values: ['breakfast', 'lunch', 'dinner', 'desserts', 'drinks', 'snacks', 'appetizers'],
      message: '{VALUE} invalid'
    }
  },
  cuisine: {
    type: String,
    enum: ['italian', 'chinese', 'indian', 'mexican', 'mediterranean', 'american', 'french', 'thai', 'japanese', 'other']
  },
  dietaryTags: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'keto', 'gluten-free', 'dairy-free', 'paleo', 'low-carb', 'pescatarian', 'nut-free', 'soy-free']
  }],
  ingredients: [{
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: {
      type: String,
      required: true,
      trim: true,
      enum: ['cups', 'tbsp', 'tsp', 'grams', 'kg', 'pounds', 'oz', 'liters', 'ml', 'pieces', 'cloves', 'slices', 'pinch', 'dash', 'whole']
    }
  }],
  instructions: [{
    stepNumber: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    image: String,
    videoUrl: String,
    timer: { type: Number, min: 0 }
  }],
  cookingTime: { type: Number, required: true, min: 1 },
  prepTime: { type: Number, required: true, min: 1 },
  totalTime: Number,
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  servings: { type: Number, required: true, min: 1, max: 100 },
  images: [{
    type: String,
    validate: { validator: v => /^https?:\/\/.+/.test(v), message: 'Invalid URL' }
  }],
  videoUrl: {
    type: String,
    validate: { validator: v => !v || /^https?:\/\/.+/.test(v), message: 'Invalid URL' }
  },
  author: { type: m.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: [{
    user: { type: m.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, maxlength: 500, trim: true },
    helpful: [{ type: m.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0, min: 0 },
  views: { type: Number, default: 0, min: 0 },
  likes: [{ type: m.Schema.Types.ObjectId, ref: 'User' }],
  nutritionInfo: {
    calories: { type: Number, min: 0 },
    protein: Number, carbs: Number, fat: Number, fiber: Number, sugar: Number, sodium: Number
  },
  tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
  isApproved: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
R.virtual('tTV').get(function() { return this.prepTime + this.cookingTime; }); // totalTimeVirtual
R.virtual('lC').get(function() { return this.likes.length; }); // likesCount

// Indexes (Simplified to a single line for brevity)
R.index({ title: 'text', description: 'text', tags: 'text' });
R.index({ category: 1, dietaryTags: 1, author: 1, averageRating: -1, createdAt: -1, views: -1, isApproved: 1, isPublished: 1, 'ingredients.name': 1 });

// Pre-save hook: Time calculation & modification date
R.pre('save', function(n) { // 'n' for next
  this.totalTime = this.prepTime + this.cookingTime;
  this.lastModified = new Date();
  if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  n();
});

// Pre-save hook: Rating calculation
R.pre('save', function(n) { // 'n' for next
  if (this.ratings.length > 0) {
    const tR = this.ratings.reduce((s, r) => s + r.rating, 0); // 's' for sum, 'r' for rating
    this.averageRating = Math.round((tR / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }
  n();
});

// Static method: findByIngredient (Minified function name)
R.statics.fBI = function(ing) { // 'fBI' for findByIngredient
  return this.find({ 'ingredients.name': { $regex: ing, $options: 'i' }, isApproved: true, isPublished: true });
};

// Static method: findPopular (Minified function name)
R.statics.fP = function(lim = 10) { // 'fP' for findPopular
  return this.find({ isApproved: true, isPublished: true }).sort({ averageRating: -1, totalRatings: -1, views: -1 }).limit(lim).populate('author', 'username profileImage');
};

// Static method: findByDifficulty (Minified function name)
R.statics.fBD = function(diff) { // 'fBD' for findByDifficulty
  return this.find({ difficulty: diff, isApproved: true, isPublished: true }).sort({ averageRating: -1 });
};

// Method: addRating (Minified function name and variables)
R.methods.aR = function(u, r, rev) { // 'aR' for addRating, 'u' for uId, 'r' for rating, 'rev' for review
  const eRI = this.ratings.findIndex(rt => rt.user.toString() === u.toString()); // 'eRI' for existingRatingIndex, 'rt' for rating
  const now = new Date();

  if (eRI > -1) {
    this.ratings[eRI] = { ...this.ratings[eRI].toObject(), rating: r, review: rev, createdAt: now };
  } else {
    this.ratings.push({ user: u, rating: r, review: rev, createdAt: now });
  }
  return this.save();
};

// Method: incrementViews (Minified function name)
R.methods.iV = function() { // 'iV' for incrementViews
  this.views += 1;
  return this.save();
};

// Method: toggleLike (Minified function name and variable)
R.methods.tL = function(u) { // 'tL' for toggleLike, 'u' for uId
  const lI = this.likes.indexOf(u); // 'lI' for likeIndex
  lI > -1 ? this.likes.splice(lI, 1) : this.likes.push(u);
  return this.save();
};

module.exports = m.model('Recipe', R);