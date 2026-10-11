const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema(
  {
    resumeFileName: {
      type: String,
      required: true,
    },
    jdText: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Comparison', comparisonSchema);
