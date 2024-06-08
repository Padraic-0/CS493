var express = require('express');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
let mysqlPool = null;
const multer = require('multer');
const Memstorage = multer.memoryStorage();
const crypto = require('crypto');
var app = express();

app.use(bodyParser.json());

const secret_key = process.env.APP_SECRET_KEY;

var port = 8087;
var businesses = [];
var reviews = [[]];
var photos = [[]];
var businesses_id = 0;
var review_ids = [];
var photo_ids = [];
var users = [];
var ip_to_user = {};

var rate = 2/1000;

//start listening on that port for connections
app.listen(port, () => {
        console.log(`Server ready! Listening on port ${port}`);
        //console.log(mysqlPool);
});

const mysql = require('mysql2');

const imageTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png'
  };

const upload = multer({
    storage: Memstorage,
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype]);
    }
});

app.use('*', (err, req, res, next) => {
    console.error(err);
    res.status(500).send({
      err: "An error occurred. Try again later."
    });
  });


function rateLimit(req, res, next) {
    const user_ip = req.ip;
    //console.log(req.ip);
    
    var user_bucket_data = ip_to_user[user_ip];

    if (!user_bucket_data) {
        ip_to_user[user_ip] = {
            "tokens": 5,
            "last": Date.now()
        };
        user_bucket_data = ip_to_user[user_ip];
    } else {
        elapsed = Date.now() - user_bucket_data.last;
        //console.log(elapsed);
        user_bucket_data.tokens = user_bucket_data.tokens + (elapsed * rate);
    }
    //console.log(user_bucket_data)
    if (user_bucket_data.tokens > 5) {
        user_bucket_data.tokens = 5;
    } else if (user_bucket_data.tokens < 0){
        user_bucket_data.tokens = 0;
    }
    //console.log(user_bucket_data)
    if (user_bucket_data.tokens >= 1) {
        user_bucket_data.tokens -= 1;
        user_bucket_data.last = Date.now();
        //console.log("Good");
        next();
    } else {
        //console.log("bad");
        return res.status(429).send({"message": "bad limit"});
    }
}
app.use(rateLimit); //throw in main
  // Perform your database operations here
  
  //connection.end(); // Close the connection when done
async function waitSQL() {
    return new Promise((resolve, reject) => {
        let retries = 0;
    
  
    
        function checkconnection() {
            console.log("User ", process.env.MYSQL_USER);
            console.log("Host ", process.env.MYSQL_HOST);
            console.log("Password ",process.env.MYSQL_PASSWORD);
            const connection = mysql.createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE
            });
            connection.connect((err) => {
                if (err) {
                    retries++
                    if (retries < 10) {
                        console.log("Retrying connection ", retries);
                        setTimeout(checkconnection, 5000);
                    } else {
                        console.log("Retried 10 times");
                        connection.end();
                    }
                } else {
                    console.log("Connected!");
                    connection.end();
                    resolve();
                }
            });
        }
        checkconnection();
    });
};


async function init(x) {
    if (x == 0) {
        try{
            await waitSQL();
            mysqlPool = require('./mysqlpool.js');
            console.log("SQL server is ready");

            const connection = mysql.createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE
            });
            
            connection.connect((err) => {
                if (err) {
                    console.error('Error connecting to MySQL:', err);
                    return;
                }
                
                console.log('Connected to MySQL server');
            });
        } catch(err) {
            console.error("Problem connecting to sql server ", err);
        }
    }
    try {
        await mysqlPool.query(`DROP DATABASE IF EXISTS api_app`);
        await mysqlPool.query(`CREATE DATABASE api_app`);
        await mysqlPool.query(`USE api_app`);
    } catch(err){
        console.log("problem reseting db", err.message);
    }

    try {
        const [ results ] = await mysqlPool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firstname VARCHAR(255) NOT NULL,
                lastname VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            )`);
                console.log("Users Table created");
            } catch(err){
                console.log("Users Table not created", err.message);
            }
    try {
        const [ results ] = await mysqlPool.query(`
            CREATE TABLE IF NOT EXISTS category (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            )`);
                console.log("Category Table created");
            } catch(err){
                console.log("Category Table not created", err.message);
            }
    try {
        const [ results ] = await mysqlPool.query(`
            CREATE TABLE IF NOT EXISTS businesses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                street_address VARCHAR(255) NOT NULL,
                city VARCHAR(255) NOT NULL,
                state VARCHAR(255) NOT NULL,
                zip VARCHAR(255) NOT NULL,
                phone VARCHAR(255) NOT NULL,
                category_id INT NOT NULL,
                website VARCHAR(255),
                email VARCHAR(255),
                FOREIGN KEY (owner_id) REFERENCES users(id),
                FOREIGN KEY (category_id) REFERENCES category(id)
            )`);
                console.log("Businesses Table created");
            } catch(err){
                console.log("Businesses Table not created", err.message);
            }
    try {
        const [ results ] = await mysqlPool.query(`
            CREATE TABLE IF NOT EXISTS sub_category (
                business_id INT NOT NULL,
                category_id INT NOT NULL,
                FOREIGN KEY (business_id) REFERENCES businesses(id),
                FOREIGN KEY (category_id) REFERENCES category(id)
               
            )`);
                console.log("Sub Category Table created");
            } catch(err){
                console.log("Sub Category Table not created", err.message);
            }
    try {
        const [ results ] = await mysqlPool.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                user_id INT NOT NULL,
                photo_name VARCHAR(255) NOT NULL,
                photo LONGBLOB NOT NULL,
                type VARCHAR(255) NOT NULL,
                description VARCHAR(255) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (business_id) REFERENCES businesses(id)
            )`);
                console.log("Photos Table created");
            } catch(err){
                console.log("Photos Table not created", err.message);
            }
    try {
        const [ results ] = await mysqlPool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                author_id INT NOT NULL,
                review VARCHAR(255) NOT NULL,
                star_rating INT NOT NULL,
                cost VARCHAR(255) NOT NULL,
                business_id INT NOT NULL,
                FOREIGN KEY (author_id) REFERENCES users(id),
                FOREIGN KEY (business_id) REFERENCES businesses(id)
            )`);
                console.log("Reviews Table created");
            } catch(err){
                console.log("Revies Table not created", err.message);
            }
}
init(0);

function filterDeleted(list) {
    if (list.length == 0) {
        return [];
    } else {
        return list.filter(elm => elm.deleted !==1);
    }
}
app.delete("/api/reset", async (req, res) => {
    init(1);
    return res.status(200).send({"message": "database reset"});
});

app.post("/api/ratelimit", async (req, res) => {
    rate = parseFloat(req.body.limit);
    return res.status(200).send({"rate": rate});
});

app.post("/users/new", async (req, res) => {
    console.log("/users/new");
    const [check] = await mysqlPool.query(`SELECT * FROM users where firstname = ? AND lastname = ?`, [req.body.firstname, req.body.lastname]);
    if (check.length > 0) {
        return res.status(400).send({"message": "sorry, your parents named you after someone else :/"});
    }
    try {
        
        const hashed_password = await bcrypt.hash(req.body.password, 8);
        console.log("Values:", req.body.firstname, req.body.lastname, req.body.firstname + req.body.lastname, hashed_password);

        const [ results ] = await mysqlPool.query(`INSERT INTO users (firstname, lastname, username, password) VALUES (?, ?, ?, ?)`,
            [req.body.firstname, req.body.lastname, req.body.firstname + req.body.lastname , hashed_password]);
        res.status(200).send({"message": "User created"});
    } catch (err) {
        console.log("User not created", err.message);
    }
});

app.get("/users/:id", requireAuth, async (req, res) => {
    console.log("get/users/:id");
    const user_id = parseInt(req.params.id);
    if (isNaN(user_id)) {
        return req.status(400).send({"message": "Not a valid user id"});
    }

    if (req.user == user_id) {
        try {
            const [ query ] = await mysqlPool.query(`SELECT * FROM users where id = ?`, [user_id]);
            return res.status(200).send({"user": query[0]});
        } catch (err) {
            console.log(err.message);
            return res.status(400).send({"message": "Failed to get user"});
        }
    } else {
        try {
            const [ query ] = await mysqlPool.query(`SELECT firstname, lastname FROM users where id = ?`, [user_id]);
            return res.status(200).send({"user": query[0]});
        } catch (err) {
            console.log(err.message);
            return res.status(400).send({"message": "Failed to get user"});
        }
    }
})

function generateAuthToken(user_id) {
    const payload = {"sub": user_id};
    return jwt.sign(payload, secret_key, { "expiresIn": "24h"});
}

function requireAuth(req, res, next) {
    const auth_header = req.get('Authorization') || '';
    const header_parts = auth_header.split(' ');
    console.log("auth header:", auth_header);
    const token = header_parts[0] == "Bearer"? header_parts[1]: null;

    console.log("token: ", token);

    try {
        const payload = jwt.verify(token, secret_key);
        req.user = payload.sub;
        console.log("user: ", req.user);
        next();
    } catch ( err ) {
        console.log(err.message);
        res.status(401).json({"message": "invalid token"});
    }
}

app.post("/login", async (req, res) => {
    console.log("/login");
    const [ login ] = await mysqlPool.query(
        "SELECT * FROM users WHERE username = ?",
        [req.body.username]);

    if (!login[0]) {
        return res.status(400).send({"message": "User not found"});
    }

    const authenticated = await bcrypt.compare(req.body.password, login[0].password);

    if (authenticated) {
        const token = generateAuthToken(login[0].id);
        return res.status(200).json({"message": "User logged in", "user": login[0], "token": token});
    } else {
        return res.status(400).send({"message": "You're wrong!"});
    }

});

async function get_category_id(name) {
    const [ result ] = await mysqlPool.query(`SELECT * FROM category WHERE name = ?`, [name]);
    if (!result[0]) {
        const [ insert ] = await mysqlPool.query(`INSERT INTO category (name) VALUES(?)`,[name]);
        console.log("New category created");
        return insert.insertId;
    } else {
        return result[0].id;
    }
}

async function already_a_business(req) {
    const [ check ] = await mysqlPool.query(`SELECT * FROM businesses WHERE name = ? AND owner_id = ? AND street_address = ? AND city = ? AND state = ? AND zip = ?`,
    [req.body.name, req.body.owner_id, req.body.address, req.body.city, req.body.state, req.body.zip]);
    return check.length > 0;
}

app.post("/businesses", requireAuth, async (req, res, next) => {
    console.log("post/businesses");
    console.log("auth: ", req.user, req.body.owner_id);
    if (req.user != req.body.owner_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    let newID = null;
    const requiredAttributes = [
        "name",
        "address",
        "city",
        "state",
        "zip",
        "phone",
        "category",
        "owner_id",
    ];
    for (const attr of requiredAttributes) {
        if (!(attr in req.body)) {
            console.log(`Missing: ${attr}`);
            return res.status(400).send({"message": "Missing attributes"});
        }
    }
    const category = await get_category_id(req.body.category);
    if (await already_a_business(req)) {
        return res.status(400).send({"message": "Already a business"});
    }
    try {
        const [ create_record ] = await mysqlPool.query(`INSERT INTO businesses
            (name, owner_id, street_address, city, state, zip, phone, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.body.name, req.body.owner_id, req.body.address, req.body.city, req.body.state, req.body.zip, req.body.phone, category]);
        
        newID = create_record.insertId;
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message":err.message});
    }
    
    if ("website" in req.body) {
        const website = req.body.website;
        const [ update_record_website ] = await mysqlPool.query(`UPDATE businesses
        SET website = ?
        WHERE id = ?`,
        [website, newID]);
    }

    if ("email" in req.body) {
        const email = req.body.email;
        const [ update_record_email ] = await mysqlPool.query(`UPDATE businesses
        SET email = ?
        WHERE id = ?`,
        [email, newID]);
    }

    return res.status(200).send({"id": newID});


});

app.put("/businesses/:id", requireAuth, async (req, res, next) => {
    console.log("put/businesses/:id");
    
    const id = parseInt(req.params.id);
    const [ check ] = await mysqlPool.query(`SELECT * FROM businesses WHERE id = ?`,[id]);
    if (!check[0]) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    if (req.user != check[0].owner_id) {
        return res.status(403).send({"message": "forbidden"});
    } 
    const { name, owner_id, street_address, city, state, zip, phone } = req.body;
    let category_id = undefined;
    if (req.body.category) {
        category_id = await get_category_id(req.body.category);
    }
    const updates = { name, owner_id, street_address, city, state, zip, phone, category_id };
    for (const key in check[0]) {
        if (updates[key] === undefined) {
            updates[key] = check[0][key];
        }
    }
    try {
        console.log(updates);
        const [ updated ] = await mysqlPool.query( `UPDATE businesses SET name = ?, owner_id = ?, street_address = ?, city = ?, state = ?, zip = ?, phone = ?, category_id = ? WHERE id = ?`,
        [updates.name, updates.owner_id, updates.street_address, updates.city, updates.state, updates.zip, updates.phone, updates.category_id, id]
        );
        return res.status(200).send({"message": "business updated"});
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message": "Failed to update business"});
    }

});

app.delete("/businesses/:id", requireAuth, async (req, res, next) => {
    console.log("delete/businesses/:id");
    const id = parseInt(req.params.id);
    const [ check ] = await mysqlPool.query(`SELECT * FROM businesses WHERE id = ?`,[id]);
    if (!check[0]) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    if (req.user != check[0].owner_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    try {
        console.log("Deleting business");
        const [ deleted ] = await mysqlPool.query(`DELETE FROM businesses WHERE id = ?`,[id]);
        return res.status(200).send({"message": `Business ${id} deleted`});
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message": "Failed to delete busniness"});
    }
});

app.get("/businesses/:id", async (req, res, next) => {
    console.log("get/businesses/:id");

    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const [ check ] = await mysqlPool.query(`SELECT * FROM businesses WHERE id = ?`,[id]);
    if (!check[0]) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    let reviews, photos;
    try {
        [ reviews ] = await mysqlPool.query(`SELECT * FROM reviews WHERE business_id = ? LIMIT ?, ?`,[id, offset, limit]);
        if (!reviews[0]) {
            throw new Error("No reviews found");
        }
    } catch ( err ) {
        console.log(err.message);
    }

    try {
        [ photos ] = await mysqlPool.query(`SELECT * FROM photos WHERE business_id = ? LIMIT ?, ?`,[id, offset, limit]);
        if (!photos[0]) {
            throw new Error("No photos found");
        }
    } catch ( err ) {
        console.log(err.message);
    }

    return res.status(200).send({
        "business": check[0],
        "reviews": reviews || [],
        "photos": photos || []
        });
});

app.get("/businesses", async (req, res, next) => {
    console.log("/businesses");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    try {
        const [ businesses ] = await mysqlPool.query(`SELECT * FROM businesses LIMIT ?, ?`,[offset,limit]);
        return res.status(200).send({
            "businesses": businesses,
            "page": page,
            "limit": limit
        });
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message": "Failed to get businesses"});
    }
});

app.post("/businesses/reviews", requireAuth, async (req, res, next) => {
    console.log("post/businesses/reviews");
    const requiredAttributes = [
        "business_id",
        "author",
        "author_id",
        "review",
        "star_rating",
        "cost"
    ];
    for (const attr of requiredAttributes) {
        if (!(attr in req.body)) {
            console.log(`Missing: ${attr}`);
            return res.status(400).send({"message": 'Missing attributes'});
        }
    }
    const business_id = parseInt(req.body.business_id);
    const author_id = parseInt(req.body.author_id);
    if (req.user != author_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    const [ check ] = await mysqlPool.query(`SELECT * FROM businesses WHERE id = ?`,[business_id]);
    if (!check[0]) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    if (check[0].owner_id == author_id) {
        return res.status(400).send({"message": "You can't review your own business"});
    }

    const [ reviews ] = await mysqlPool.query(`SELECT * FROM reviews WHERE business_id = ? AND author_id = ?`,[business_id, author_id]);
    if (reviews[0]) {
        return res.status(400).send({"message": "You can only write one review per business"});
    }

    try {
        const [ create_record ] = await mysqlPool.query(`INSERT INTO reviews
            (author_id, review, star_rating, cost, business_id) VALUES (?, ?, ?, ?, ?)`,
            [author_id, req.body.review, req.body.star_rating, req.body.cost, business_id]);
        
        newID = create_record.insertId;
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message":err.message});
    }
    
    return res.status(200).send({"message": "review posted"});

});

app.put("/businesses/reviews/:review_id", requireAuth, async (req, res, next) => {
    console.log("put/businesses/reviews");
    const review_id = parseInt(req.params.review_id);
    const [ check ] = await mysqlPool.query(`SELECT * FROM reviews WHERE id = ? `,[review_id]);
    if (!check[0]) {
        return res.status(404).send({"message": "review not found"});
    }
    if (req.user != check[0].author_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    const { review, star_rating} = req.body;
    const updates = { review, star_rating};
    for (const key in check[0]) {
        if (updates[key] === undefined) {
            updates[key] = check[0][key];
        }
    }
    try {
        console.log(updates);
        const [ updated ] = await mysqlPool.query( `UPDATE reviews SET review = ?, star_rating = ? WHERE id = ?`,
        [updates.review, updates.star_rating, review_id]
        );
        return res.status(200).send({"message": "review updated"});
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message": "Failed to update review"});
    }

});

app.get("/businesses/reviews/:business_id", async (req, res, next) => {
    console.log("get/businesses/reviews/:business_id");
    const business_id = parseInt(req.params.business_id);
    console.log(business_id);

    const [ check ] = await mysqlPool.query(`SELECT * FROM reviews WHERE business_id = ? `,[business_id]);
    if (!check[0]) {
        return res.status(404).send({"message": "reviews not found"});
    }

    return res.status(200).send({
        "reviews": check || []
    });
});

app.delete("/businesses/reviews/:review_id", requireAuth, async (req, res, next) =>{
    console.log("delete/businesses/reviews");
    const review_id = parseInt(req.params.review_id);
    const [ check ] = await mysqlPool.query(`SELECT * FROM reviews WHERE id = ?`,[review_id]);
    if (!check[0]) {
        return res.status(404).send({"message": "reviews not found"});
    } else if (req.user != check[0].author_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    const [ query ] = await mysqlPool.query(`DELETE FROM reviews WHERE id = ? `,[review_id]);
    if (query.affectedRows === 0) {
        return res.status(404).send({"message": "Failed to delete review"});
    } else {
    return res.status(200).send({"message": "Review deleted"});
    }
});

app.get("/users/reviews/:author_id" , requireAuth, async (req, res, next) => {
    console.log("get/users/reviews/:author_id");

    const author_id = parseInt(req.params.author_id);
    if (req.user != author_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    const [ author_reviews ] = await mysqlPool.query(`SELECT * FROM reviews WHERE author_id = ?`,[author_id]);
    if (!author_reviews[0]){
        return res.status(404).send({"message": "Reviews not found"});
    } else {
        return res.status(200).send({"author_reviews": author_reviews});
    }
});

app.get("businesses/photos/:id", (req, res, next) => {
    const path = `${__dirname}/uploads/${req.params.id}`;
    res.setHeader("Content-Type", "image/jpeg").sendFile(path);
})

app.post("/businesses/photos", requireAuth, upload.single('photo'), async (req, res, next) =>{
    console.log("post/businesses/photos");
    console.log("body ", req.body);
    const requiredAttributes = [
        "business_id",
        "user_id",
        "description"
    ];
    for (const attr of requiredAttributes) {
        if (!(attr in req.body)) {
            console.log(`Missing: ${attr}`);
            return res.status(400).send({"message": 'Missing attributes'});
        }
    }
    if (req.user != req.body.user_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    const business_id = parseInt(req.body.business_id);

    const [ check ] = await mysqlPool.query(`SELECT * FROM businesses WHERE id = ?`,[business_id]);
    if (!check[0]){
        return res.status(404).send({"message": "Business not found"});
    }
    const photo_buffer = req.file.buffer;
    const filename = req.file.originalname;
    const extension = imageTypes[req.file.mimetype];
    if (!extension) {
        return res.status(400).send({"message": "Invalid file type"});
    }

    try {
        const [ post_photo ] = await mysqlPool.query(`INSERT INTO photos
            (business_id, user_id, photo_name, photo, type, description) VALUES (?, ?, ?, ?, ?, ?)`,
            [business_id, req.body.user_id, filename, photo_buffer, req.file.mimetype, req.body.description]);
        
        newID = post_photo.insertId;
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message":err.message});
    }
    
    return res.status(200).send({"message": "Photo posted", "photo_id": newID, "filename": filename});

});

app.put("/businesses/photos/:photo_id", requireAuth, async (req, res, next) => {
    console.log("put/businesses/photos/:photo_id");
    
    const photo_id = parseInt(req.params.photo_id);
    const [ check ] = await mysqlPool.query(`SELECT photo_name, description, user_id FROM photos WHERE id = ? `,[photo_id]);
    if (!check[0]) {
        return res.status(404).send({"message": "photo not found"});
    }
    if (req.user !== check[0].user_id) {
        return res.status(403).send({"message": "forbidden"});
    }
    
    const {photo_name, description} = req.body;
    const updates = { photo_name, description};
    for (const key in check[0]) {
        if (updates[key] === undefined) {
            updates[key] = check[0][key];
        }
    }
    try {
        console.log(updates);
        const [ updated ] = await mysqlPool.query( `UPDATE photos SET photo_name = ?, description = ? WHERE id = ?`,
        [updates.photo_name, updates.description, photo_id]
        );
        return res.status(200).send({"message": "photo updated"});
    } catch ( err ) {
        console.log(err.message);
        return res.status(400).send({"message": "Failed to update photo"});
    }

});

app.delete("/businesses/photos/:photo_id" ,requireAuth, async (req, res, next) =>{
    console.log("delete/businesses/photos/:photo_id");
    const photo_id = parseInt(req.params.photo_id);
    console.log("photo id", photo_id);
    console.log("user id ", req.user);
    const [ check ] = await mysqlPool.query(`DELETE FROM photos WHERE id = ? AND user_id = ?`,[photo_id, req.user]);
    if (check.affectedRows === 0) {
        return res.status(404).send({"message": "photo not found", "user": req.user});
    } else {
    return res.status(200).send({"message": "photo deleted"});
    }
});

app.get("/businesses/photos/:photo_id", async (req, res, next) =>{
    console.log("get/businesses/photos/:photo_id");
    const photo_id = parseInt(req.params.photo_id);
    if (isNaN(photo_id)) {
        return res.status(400).send({"message": "fix format"});
    } else {
        const [ photo ] = await mysqlPool.query(`SELECT * FROM photos WHERE id = ?`,[photo_id]);
        if (!photo[0]){
            return res.status(404).send({"message": "photo not found"});
        } else {
            return res.setHeader("Content-Type", photo[0].type).send(photo[0].photo);
        }
        
    }
});

app.get("/businesses/photos/all/:business_id",async (req, res, next) =>{
    console.log("get/businesses/photos/:business_id");
    const business_id = parseInt(req.params.business_id);
    if (isNaN(business_id)) {
        return res.status(400).send({"message": "fix format"});
    } else {
        const [ photos ] = await mysqlPool.query(`SELECT id FROM photos WHERE business_id = ?`,[business_id]);
        if (!photos[0]){
            return res.status(404).send({"message": "photos not found"});
        } else {
            return res.status(200).send({"photos":photos});
        }
        
    }
});
