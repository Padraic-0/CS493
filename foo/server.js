var express = require('express');
var bodyParser = require('body-parser');


var app = express();

app.use(bodyParser.json());

var port = 8087;

//start listening on that port for connections
app.listen(port, () => {
        console.log("Server ready!");
});
// handle certain api endpoints
var count = 0.01
app.get("/counter", (req, res, next) => {
        res.status(200);
        console.log(req.query);
        res.send(`${count}`);
        count *=2.3;
});
var messages = [];
app.get("/messages", (req, res, next) => {
    const index = req.query.index;
    if (index === undefined) {
        res.send(messages);
    } else {
        console.log(index);
        try {
            const response = messages[index];
            if (response === undefined) {
                throw new Error('Index out of bounds');
            }
            res.status(200).send(response);
        } catch(error) {
            res.status(403).send("Out of bounds");
        }
    }
});

app.post("/messages", (req, res, next) => {
        res.status(200);
        const new_message = req.body.message;
        console.log(new_message);
        messages.push({"message": `${new_message}`, "deleted": "0"});
        res.send('Message received');

});

app.delete("/messages", (req, res, next) => {
    const index = parseInt(req.query.index);
    if (index === undefined) {
        res.status(403).send("No message to delete");
    } else {
        console.log(index);
        try {
            messages[index].deleted = "1";
            res.status(200).send(messages[index]);
        } catch (error) {
            res.status(403).send("Message removale failure");
        }
    }

});