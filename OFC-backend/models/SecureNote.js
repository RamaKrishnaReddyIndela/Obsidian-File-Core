const mongoose = require('mongoose');
const crypto = require('crypto');

const secureNoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  encryptedContent: {
    type: String,
    required: true
  },
  contentHash: {
    type: String,
    required: true
  },
  encryptionMethod: {
    type: String,
    default: 'AES-256-GCM'
  },
  salt: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  category: {
    type: String,
    default: 'general',
    maxlength: 50
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    contentLength: Number,
    wordCount: Number,
    lastModified: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
secureNoteSchema.index({ user: 1, createdAt: -1 });
secureNoteSchema.index({ user: 1, category: 1 });
secureNoteSchema.index({ user: 1, tags: 1 });
secureNoteSchema.index({ title: 'text', tags: 'text' });
secureNoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if note is expired
secureNoteSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Static method to encrypt content
secureNoteSchema.statics.encryptContent = function(content, password) {
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  // Derive key from password using PBKDF2
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  
  // Encrypt content
  const cipher = crypto.createCipher('aes-256-gcm', key);
  cipher.setAAD(salt); // Additional authenticated data
  
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Create content hash for integrity verification
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  
  return {
    encryptedContent: encrypted + ':' + authTag.toString('hex'),
    contentHash,
    salt: salt.toString('hex'),
    iv: iv.toString('hex')
  };
};

// Static method to decrypt content
secureNoteSchema.statics.decryptContent = function(encryptedData, password, salt, iv) {
  try {
    const [encrypted, authTagHex] = encryptedData.split(':');
    const authTag = Buffer.from(authTagHex, 'hex');
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // Derive key from password
    const key = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha512');
    
    // Decrypt content
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(saltBuffer);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Invalid password or corrupted data');
  }
};

// Method to verify content integrity
secureNoteSchema.methods.verifyIntegrity = function(decryptedContent) {
  const currentHash = crypto.createHash('sha256').update(decryptedContent).digest('hex');
  return currentHash === this.contentHash;
};

// Method to update access tracking
secureNoteSchema.methods.trackAccess = async function() {
  this.lastAccessed = new Date();
  this.accessCount += 1;
  return this.save();
};

// Pre-save middleware to update metadata
secureNoteSchema.pre('save', function(next) {
  if (this.isModified('encryptedContent')) {
    this.metadata.lastModified = new Date();
  }
  next();
});

// Static method to search notes
secureNoteSchema.statics.searchNotes = async function(userId, query, filters = {}) {
  const searchQuery = { user: userId };
  
  // Add text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Add filters
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    searchQuery.tags = { $in: filters.tags };
  }
  
  if (filters.priority) {
    searchQuery.priority = filters.priority;
  }
  
  if (filters.isArchived !== undefined) {
    searchQuery.isArchived = filters.isArchived;
  }
  
  // Exclude expired notes unless specifically requested
  if (!filters.includeExpired) {
    searchQuery.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];
  }
  
  return this.find(searchQuery)
    .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .limit(filters.limit || 50);
};

module.exports = mongoose.model('SecureNote', secureNoteSchema);