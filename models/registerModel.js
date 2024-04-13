const mongoose = require('mongoose')
const { Schema, model } = mongoose

const registerSchema = new Schema({
    name: String,
    email: String,
    password: String,
    verified: Boolean
})

module.exports  = mongoose.models?.Register || model('Register', registerSchema )