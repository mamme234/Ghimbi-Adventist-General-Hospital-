// ========== NEWS MODEL ==========
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    newsId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    excerpt: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['hospital_news', 'health_tips', 'events', 'achievements', 'announcements', 'featured'],
        default: 'hospital_news'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    featuredImage: {
        url: String,
        alt: String,
        caption: String
    },
    images: [{
        url: String,
        alt: String,
        caption: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        email: String,
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        isApproved: {
            type: Boolean,
            default: false
        }
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
NewsSchema.index({ newsId: 1 });
NewsSchema.index({ slug: 1 });
NewsSchema.index({ category: 1 });
NewsSchema.index({ tags: 1 });
NewsSchema.index({ isPublished: 1 });
NewsSchema.index({ publishedAt: -1 });
NewsSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// ========== PRE-SAVE HOOKS ==========
NewsSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('title')) {
        // Generate slug
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// ========== INSTANCE METHODS ==========
NewsSchema.methods.publish = function() {
    this.isPublished = true;
    this.publishedAt = new Date();
    return this.save();
};

NewsSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

NewsSchema.methods.addComment = function(commentData) {
    this.comments.push({
        ...commentData,
        createdAt: new Date()
    });
    return this.save();
};

module.exports = mongoose.model('News', NewsSchema);
