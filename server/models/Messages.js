const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    conversationId: {
        type: String,
    },
    senderId: {
        type: String,
    },
    message: {
        type: String,
    },
    file: {
        filename: String,
        fileType: String,
        filePath: String,
    },
    active: {
        type: Boolean,
        default: true, 
    },
});

const Messages = mongoose.model('Message', messageSchema);

module.exports = Messages;
