const mongoose = require('mongoose')
const { Schema, model } = mongoose.Schema

const loginSchema =  new Schema({
    email: String,
    password: String
})

module.exports  = mongoose.models?.Login || model('Login', loginSchema )