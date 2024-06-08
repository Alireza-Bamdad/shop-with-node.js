const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    title : String,
    price : String,
    image : String,
});

module.exports = mongoose.model('product', productSchema);