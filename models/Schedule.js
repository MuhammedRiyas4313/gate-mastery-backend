const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Virtual for status based on dates
scheduleSchema.virtual('status').get(function () {
    const now = new Date();
    if (now < this.startDate) {
        return 'Upcoming';
    } else if (now > this.endDate) {
        return 'Completed';
    } else {
        return 'Ongoing';
    }
});

// Ensure virtuals are included in JSON output
scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
