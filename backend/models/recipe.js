const M = require('mongoose');

const RSchema = new M.Schema({
  title: {
    type: String,
    required: [true, 'Recipe title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Recipe description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Recipe category is required'],
    enum: {
      values: ['breakfast', 'lunch', 'dinner', 'desserts', 'drinks', 'snacks', 'appetizers'],
      message: '{VALUE} is not a valid category'
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
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Ingredient quantity is required'],
      min: [0.01, 'Quantity must be greater than 0']
    },
    unit: {
      type: String,
      required: [true, 'Ingredient unit is required'],
      trim: true,
      enum: ['cups', 'tbsp', 'tsp', 'grams', 'kg', 'pounds', 'oz', 'liters', 'ml', 'pieces', 'cloves', 'slices', 'pinch', 'dash', 'whole']
    }
  }],
  instructions: [{
    stepNumber: {
      type: Number,
      required: [true, 'Step number is required'],
      min: [1, 'Step number must be at least 1']
    },
    description: {
      type: String,
      required: [true, 'Step description is required'],
      trim: true,
      maxlength: [500, 'Step description cannot exceed 500 characters']
    },
    image: String,
    videoUrl: String,
    timer: {
      type: Number,
      min: [0, 'Timer cannot be negative']
    }
  }],
  cookingTime: {
    type: Number,
    required: [true, 'Cooking time is required'],
    min: [1, 'Cooking time must be at least 1 minute']
  },
  prepTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [1, 'Preparation time must be at least 1 minute']
  },
  totalTime: Number,
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: '{VALUE} is not a valid difficulty level'
    }
  },
  servings: {
    type: Number,
    required: [true, 'Number of servings is required'],
    min: [1, 'Servings must be at least 1'],
    max: [100, 'Servings cannot exceed 100']
  },
  images: [{
    type: String,
    validate: {
      validator: v => /^https?:\/\/.+/.test(v),
      message: 'Image must be a valid URL'
    }
  }],
  videoUrl: {
    type: String,
    validate: {
      validator: v => !v || /^https?:\/\/.+/.test(v),
      message: 'Video URL must be a valid URL'
    }
  },
  author: {
    type: M.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipe author is required']
  },
  ratings: [{
    user: {
      type: M.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters'],
      trim: true
    },
    helpful: [{
      type: M.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  likes: [{
    type: M.Schema.Types.ObjectId,
    ref: 'User'
  }],
  nutritionInfo: {
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative']
    },
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isApproved: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

RSchema.virtual('totalTimeVirtual').get(function() { return this.prepTime + this.cookingTime; });
RSchema.virtual('likesCount').get(function() { return this.likes.length; });

RSchema.index({ title: 'text', description: 'text', tags: 'text' });
RSchema.index({ category: 1 });
RSchema.index({ dietaryTags: 1 });
RSchema.index({ author: 1 });
RSchema.index({ averageRating: -1 });
RSchema.index({ createdAt: -1 });
RSchema.index({ views: -1 });
RSchema.index({ isApproved: 1, isPublished: 1 });
RSchema.index({ 'ingredients.name': 1 });
RSchema.index({ category: 1, averageRating: -1 });
RSchema.index({ dietaryTags: 1, category: 1 });

RSchema.pre('save', function(next) {
  this.totalTime = this.prepTime + this.cookingTime;
  this.lastModified = new Date();
  if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  next();
});

RSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const tR = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = Math.round((tR / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }
  next();
});

RSchema.statics.findByIngredient = function(ing) {
  return this.find({ 'ingredients.name': { $regex: ing, $options: 'i' }, isApproved: true, isPublished: true });
};

RSchema.statics.findPopular = function(lim = 10) {
  return this.find({ isApproved: true, isPublished: true }).sort({ averageRating: -1, totalRatings: -1, views: -1 }).limit(lim).populate('author', 'username profileImage');
};

RSchema.statics.findByDifficulty = function(diff) {
  return this.find({ difficulty: diff, isApproved: true, isPublished: true }).sort({ averageRating: -1 });
};

RSchema.methods.addRating = function(uId, rating, review) {
  const eRI = this.ratings.findIndex(r => r.user.toString() === uId.toString());
  const now = new Date();

  if (eRI > -1) {
    this.ratings[eRI] = { ...this.ratings[eRI].toObject(), rating, review, createdAt: now };
  } else {
    this.ratings.push({ user: uId, rating, review, createdAt: now });
  }
  return this.save();
};

RSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

RSchema.methods.toggleLike = function(uId) {
  const lI = this.likes.indexOf(uId);
  lI > -1 ? this.likes.splice(lI, 1) : this.likes.push(uId);
  return this.save();
};

module.exports = M.model('Recipe', RSchema);