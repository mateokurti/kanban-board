import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

TeamSchema.index({ userId: 1, name: 1 }, { unique: true });

TeamSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);