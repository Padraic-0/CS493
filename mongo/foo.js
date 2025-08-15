const express = require('express');

const { MongoClient } = require('mongodb');

const app = express();

app.use(express.json());

async function init_mongo() {
    const mongoHost = process.env.MONGO_HOST || "mongo-server";
    const mongoPort = process.env.MONGO_PORT || 27017;
    const mongoUser = process.env.MONGO_USER;
    const mongoPassword = process.env.MONGO_PASSWORD;
    console.log(mongoUser, mongoPassword);
    const mongoDBName = process.env.MONGO_DB_NAME;

    const url = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;

    return await MongoClient.connect(url);

}

async function init() {
    await init_mongo();

    app.listen(3000, () => {
        console.log("Listening on port 3000");
    });
}

init();