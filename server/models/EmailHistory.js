const mongoose = require('mongoose');

const emailHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prompt: { type: String, required: true },
    subject: { type: String, required: true },
    emailBody: { type: String, required: true },
    linkedInDM: { type: String, required: true },
    followUpEmail: { type: String, required: true }
}, { timestamps: true });

const EmailHistory = mongoose.model('EmailHistory', emailHistorySchema);
module.exports = EmailHistory;
