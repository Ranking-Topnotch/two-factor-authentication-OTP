const mongoose = require('mongoose')
const { Schema, model } = mongoose

const otpSchema = new Schema({
    userId: String,
    otp: String,
    createdAt: Date,
    expiresAt: Date,
})

module.exports  = mongoose.models?.Otp || model('Otp', otpSchema )