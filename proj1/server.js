var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());

var port = 8087;
var businesses = [];
var reviews = [[]];
var photos = [[]];
var businesses_id = 0;
var review_ids = {};
var photo_ids = {};
var users = [];

//start listening on that port for connections
app.listen(port, () => {
        console.log(`Server ready! Listening on port ${port}`);
});

function filterDeleted(list) {
    if (list.length == 0) {
        return [];
    } else {
        return list.filter(elm => elm.deleted !==1);
    }
}

app.post("/businesses", (req, res, next) => {
    console.log("post/businesses");
    const requiredAttributes = [
        "name",
        "address",
        "city",
        "state",
        "zip",
        "phone",
        "category",
        "subcategories",
        "owner_id",
        "owner"
    ];
    for (const attr of requiredAttributes) {
        if (!(attr in req.body) || !req.body[attr]) {
            console.log(`Missing: ${attr}`);
            return res.status(400).send({"message": "Missing attributes"});
        }
    }

    businesses.push({
        "id": businesses_id,
        "name": req.body.name,
        "address": req.body.address,
        "city": req.body.city,
        "state": req.body.state,
        "zip": req.body.zip,
        "phone": req.body.phone,
        "category": req.body.category,
        "subcategories": req.body.subcategories,
        "owner_id": req.body.owner_id,
        "owner": req.body.owner,
        "deleted" : 0
    });
    if ("website" in req.body) {
        businesses[businesses_id].website = req.body.website;
    }
    if ("email" in req.body) {
        businesses[businesses_id].email = req.body.email;
    }
    review_ids[businesses_id] = 0;
    photo_ids[businesses_id] = 0;
    reviews.push([]);
    photos.push([]);
    businesses_id += 1;
    return res.status(200).send({"id": businesses_id});


});

app.put("/businesses/:id", (req, res, next) => {
    console.log("put/businesses/:id");
    const id = parseInt(req.params.id);
    if (businesses_id <= id || id < 0) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    if ("owner_id" in req.body) {
        if (req.body.owner_id == businesses[id].owner_id){
            for (const key in req.body) {
                businesses[id][key] = req.body[key];
            }
            return res.status(200).send({"business": businesses[id]});
        } else {
            return res.status(403).send({"message": "Unauthorized"});
        }
    } else {
        return res.status(400).send({"message": "Missing attributes"});
    }
});

app.delete("/businesses/:id", (req, res, next) => {
    console.log("delete/businesses/:id");
    const id = parseInt(req.params.id);
    if (businesses_id <= id || id < 0) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    businesses[id].deleted = 1;
    return res.status(200).send({"message": `Business ${id} deleted`});
});

app.get("/businesses/:id", (req, res, next) => {
    console.log("get/businesses/:id");
    const id = parseInt(req.params.id);
    if (businesses_id <= id || id < 0) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    if (businesses[id].deleted == 1) {
        res.status(404).send({"message": "Business has been deleted"});
    }
    const filtered_reviews = filterDeleted(reviews[id]);
    const filtered_photos = filterDeleted(photos[id]);
    return res.status(200).send({
        "business": businesses[id],
        "reviews": filtered_reviews || [],
        "photos": filtered_photos || []
        });
});

app.get("/businesses", (req, res, next) => {
    const filtered_businesses = filterDeleted(businesses);
    return res.status(200).send({"businesses": filtered_businesses});
});

app.post("/businesses/reviews", (req, res, next) => {
    console.log("post/businesses/reviews");
    const requiredAttributes = [
        "business_id",
        "author",
        "author_id",
        "review",
        "star",
        "cost"
    ];
    for (const attr of requiredAttributes) {
        if (!(attr in req.body) || !req.body[attr]) {
            console.log(`Missing: ${attr}`);
            return res.status(400).send({"message": 'Missing attributes'});
        }
    }
    const business_id = parseInt(req.body.business_id);
    const author_id = parseInt(req.body.author_id);

    if (author_id == businesses[business_id].owner_id) {
        return res.status(400).send({"message": `${businesses[business_id].owner}, you can't review your own business!`});
    }

    for (const review of reviews[business_id]) {
        if (author_id == review.author_id) {
            return res.status(400).send({"message": "You may only write one review per business"});
        }
    }
    reviews[business_id].push({
        "id": review_ids[business_id],
        "business_id": req.body.business_id,
        "author": req.body.author,
        "author_id": req.body.author_id,
        "review": req.body.review,
        "star": req.body.star,
        "cost": req.body.cost,
        "deleted": 0
    })
    review_ids[business_id] += 1;
    return res.status(200).send({"review": reviews[business_id][reviews[business_id].length -1]});

});

app.put("/businesses/reviews/:business_id/:review_id", (req, res, next) => {
    console.log("put/businesses/reviews");
    const business_id = parseInt(req.params.business_id);
    const review_id = parseInt(req.params.review_id);
    if (businesses_id <= business_id || business_id < 0) {
        return res.status(404).send({"message": "Busniness not found"});
    }
    if (review_ids[business_id] <= review_id || review_id < 0) {
        return res.status(404).send({"message": "Review not found"});
    }
    for (const key in req.body) {
        reviews[business_id][review_id][key] = req.body[key];
    }
    return res.status(200).send({"review": reviews[business_id][review_id]});

});

app.get("/businesses/reviews/:business_id", (req, res, next) => {
    console.log("get/businesses/reviews/:business_id");
    const business_id = parseInt(req.params.business_id);
    console.log(business_id);
    if (businesses_id <= business_id || business_id < 0) {
        return res.status(404).send({"message": "Business not found"});
    }
    if (businesses[business_id].deleted == 1) {
        return res.status(400).send({"message": "Business deleted"});
    }
    const filted_reviews = filterDeleted(reviews[business_id]);
    console.log("here");
    return res.status(200).send({
        "business": businesses[business_id].name,
        "reviews": filted_reviews[business_id] || []
    });
});

app.delete("/businesses/reviews/:business_id/:review_id", (req, res, next) =>{
    console.log("delete/businesses/reviews");
    const business_id = parseInt(req.params.business_id);
    const review_id = parseInt(req.params.review_id);
    if (businesses_id <= business_id || business_id < 0) {
        return res.status(404).send({"message": "Business not found"});
    }
    if (businesses[business_id].deleted == 1) {
        return res.status(400).send({"message": "Business deleted"});
    }
    if (review_ids[business_id] <= review_id || review_id < 0) {
        return res.status(404).send({"message": "Review not found"});
    }
    reviews[business_id][review_id].deleted = 1;
    return res.status(200).send({"message": "Review deleted"})
});

app.get("/users/reviews/:user_id" , (req, res, next) => {
    console.log("get/users/reviews/:user_id");
    const user_id = parseInt(req.params.user_id);

    const user_reviews = reviews.map(business => 
        business.filter(review => 
            (review.deleted !==1 && review.author_id == user_id)
        )
    );
    if (user_reviews.flat().length == 0){
        return res.status(404).send({"message": "User not found"});
    } else {
        return res.status(200).send({"user_reviews":user_reviews.flat()});
    }
});

app.post("/businesses/photos" , (req, res, next) =>{
    console.log("post/businesses/photos");
    const requiredAttributes = [
        "business_id",
        "link",
        "description"
    ];
    for (const attr of requiredAttributes) {
        if (!(attr in req.body) || !req.body[attr]) {
            console.log(`Missing: ${attr}`);
            return res.status(400).send({"message": 'Missing attributes'});
        }
    }
    const business_id = parseInt(req.body.business_id);
    if (businesses.length <= business_id || business_id < 0) {
        return res.status(404).send({"message": "Business not found"});
    }
    if (businesses[business_id].deleted == 1) {
        return res.status(400).send({"message": "Business deleted"});
    }
    
    photos[business_id].push({
        "review_id": review_ids[business_id],
        "business_id": req.body.business_id,
        "link": req.body.link,
        "description":  req.body.description,
        "deleted": 0
    });
    photo_ids[business_id] += 1;
    res.status(200).send({"photo": photos[business_id][photos[business_id].length -1]});

});

app.put("/businesses/photos/:business_id/:photo_id" , (req, res, next) =>{
    console.log("put/businesses/photos/:business_id/:photo_id");
    const business_id = parseInt(req.params.business_id);
    const photo_id = parseInt(req.params.photo_id);
    if (businesses_id <= business_id || business_id < 0) {
        return res.status(404).send({"message": "Business not found"});
    }
    if (businesses[business_id].deleted == 1) {
        return res.status(400).send({"message": "Business deleted"});
    }
    if (photo_id[business_id] <= photo_id || photo_id < 0) {
        return res.status(404).send({"message": "Photo not found"});
    }
    if (photos[business_id].deleted == 1) {
        return res.status(400).send({"message": "Photo deleted"});
    }
    if ("description" in req.body) {
        photos[business_id][photo_id].description = req.body.description;
        return res.status(200).send({"message": "Description updated"})
    } else {
        return res.status(400).send({"message": "Missing attribute"})
    }
});

app.delete("/businesses/photos/:business_id/:photo_id" , (req, res, next) =>{
    console.log("delete/businesses/photos/:business_id/:photo_id");
    const business_id = parseInt(req.params.business_id);
    const photo_id = parseInt(req.params.photo_id);
    if (isNaN(business_id) || isNaN(photo_id)) {
        return res.status(400).send({"message": "fix format"});
    } else {
        photos[business_id][photo_id].deleted == 1;
        return res.status(200).send({"message": "photo deleted"});
    }
});

app.get("/businesses/photos/:business_id/:photo_id", (req, res, next) =>{
    console.log("get/businesses/photos/:business_id/:photo_id");
    const business_id = parseInt(req.params.business_id);
    const photo_id = parseInt(req.params.photo_id);
    if (isNaN(business_id) || isNaN(photo_id)) {
        return res.status(400).send({"message": "fix format"});
    } else {
        if (businesses_id <= business_id || photo_ids[business_id] <= photo_id || photo_id < 0 || business_id < 0){
            return res.status(400).send({"message": "Not valid business or id"});
        } else{
            const photo = photos[business_id][photo_id];
            if (photo.deleted == 1) {
                return res.status(400).send({"message": "Photo deleted"});
            } else {
                return res.status(200).send({"photo": photo});
            }
        }
        
    }
});

app.get("/businesses/photos/:business_id", (req, res, next) =>{
    console.log("get/businesses/photos/:business_id");
    const business_id = parseInt(req.params.business_id);
    if (isNaN(business_id)) {
        return res.status(400).send({"message": "fix format"});
    } else {
        if (businesses_id <= business_id || business_id < 0){
            return res.status(400).send({"message": "Not valid business"});
        } else{
            const filtered_photos = filterDeleted(photos[business_id]);
            return res.status(200).send({"photos": filtered_photos});
        }
        
    }
});
