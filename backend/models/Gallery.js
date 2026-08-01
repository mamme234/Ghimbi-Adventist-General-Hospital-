// ========== GALLERY MODEL ==========
const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
    galleryId: {
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
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['hospital', 'staff', 'patients', 'events', 'facilities', 'awards', 'community', 'other'],
        default: 'hospital'
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        thumbnail: String,
        caption: String,
        alt: String,
        order: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    coverImage: {
        url: String,
        thumbnail: String,
        alt: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
GallerySchema.index({ galleryId: 1 });
GallerySchema.index({ category: 1 });
GallerySchema.index({ title: 'text', description: 'text' });
GallerySchema.index({ isPublished: 1 });
GallerySchema.index({ createdAt: -1 });

// ========== INSTANCE METHODS ==========
GallerySchema.methods.addImage = function(imageData) {
    this.images.push({
        ...imageData,
        uploadedAt: new Date()
    });
    if (!this.coverImage) {
        this.coverImage = {
            url: imageData.url,
            thumbnail: imageData.thumbnail,
            alt: imageData.alt
        };
    }
    return this.save();
};

GallerySchema.methods.removeImage = function(imageIndex) {
    if (this.images[imageIndex]) {
        this.images.splice(imageIndex, 1);
        return this.save();
    }
    throw new Error('Image not found');
};

GallerySchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

module.exports = mongoose.model('Gallery', GallerySchema);
