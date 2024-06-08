const express = require('express');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const userModel = require('./model/user');
const Product = require('./model/prodcts');
const multer = require('multer');
const path = require('path');
const { unlink } = require('fs/promises');
const { log } = require('console');
const user = require('./model/user');

const app = express();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage: storage });
  

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser())



app.get('/shop' ,isLoggedIn, async (req, res) => {
    let email = req.user.email;
    let user = await userModel.find({email});
    const products = await Product.find();
    res.render('index', { products , user});


});


app.get('/add-product', isLoggedIn, isAdmin,(req, res) => {
    res.render('add-product');
});

app.get('/admin' ,isLoggedIn,isAdmin, async (req, res) => {
    const products = await Product.find();
    res.render('admin' , { products: products });
});


app.post('/add-product',isLoggedIn,isAdmin, upload.single('image'), async (req, res) => {
    const newProduct = new Product({
      title: req.body.title,
      price: req.body.price,
      image: `/uploads/${req.file.filename}`
    });
    await newProduct.save();
    res.redirect('/admin');
  });

// Render Edite page
app.get('/edit-product/:id',isLoggedIn,isAdmin, async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.render('edit-product', { product: product });
});


app.post('/edit-product/:id',isLoggedIn,isAdmin, upload.single('image'), async (req, res) => {
    const product = await Product.findById(req.params.id);
    product.title = req.body.title;
    product.price = req.body.price;
    if (req.file) {
        product.image = `/uploads/${req.file.filename}`;
    }
    await product.save();
    res.redirect('/admin');
});


app.post('/delete-product/:id',isLoggedIn,isAdmin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});


//Render Login Page
app.get('/', (req , res) => {
    res.render('login')
});

//Render Sign up Page
app.get('/signup', (req , res) => {
    res.render('signup')
});

app.post('/signup', async (req, res) => {
    
    let { email, password, name } = req.body;
    //get user by email in database
    let user = await userModel.findOne({email});

    //if user exsist in database 
    if(user) return res.status(500).redirect('/signup');

    // if not user in data base add user to database
    bcrypt.genSalt(12, (err, salt) => {
        bcrypt.hash(password, salt, async(err, hash) => {
            let user = await userModel.create({
                name : name,
                email : email,
                password : hash,
                admine : false,
            })
            // set token    
            let token = jwt.sign({email : email , userid : user._id} , "shhhh");
            res.cookie("token", token);

            //when success signup redirect to login page
            res.redirect("/")

        })
    })

})

app.post('/', async (req, res) => {
    //get from input email and password
    let {email , password} = req.body;

    //check the exist user
    let user = await userModel.findOne({email});
    
    //if user not in database
    if (!user) return res.status(500).redirect('/');

    //if user exist
    bcrypt.compare(password , user.password , function(err , result){
        if(result){
            let token = jwt.sign({email : email , userid : user._id} , "shhhh");
            res.cookie("token", token);
            if(user.admine){
                res.status(200).redirect('/admin')
            }
            else{
                res.status(200).redirect('/shop')
            }
            

        }
        else{
            res.redirect('/')
        }

    })
})

app.get('/logout', (req, res) => {
    res.cookie("token","");
    res.redirect('/');

})

function isLoggedIn (req, res, next){
    // if not logged in 
    if (req.cookies.token===""){
        res.redirect('/')
    }
    //if logged 
    else{
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
    }
    next(); 
}

async function isAdmin(req, res, next) {

    let email = req.user.email;
    let user  = await userModel.findOne({email})
    if(!user.admine){
        res.redirect('/shop')
    }
    next();
}

//set port
app.listen("8000",() => {
    console.log("app run in port 8000");
});