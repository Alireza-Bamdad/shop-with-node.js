// user model database

const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/finalweb');

// create user modele
const userSchema = mongoose.Schema({
    admine : Boolean,
    name : String,
    email : String,
    password : String,
});

module.exports = mongoose.model('user', userSchema );