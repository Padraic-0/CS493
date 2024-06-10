const amqp = require('amqplib');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function connect() {
    try {
        const connection = await amqp.connect('amqp://rabbitmq:5672');
        console.log('Connected to RabbitMQ!');
        return connection
    } catch (error) {
        console.error('Error:', error.message);
        console.log('Retrying connection in 30 seconds...');
        await delay(15000); // Wait for 30 seconds before retrying
        return connect();
    }
}

async function processqueue() {
    const connection = await connect()
    const mysqlPool = require('./mysqlpool.js');
    try {
        const channel = await connection.createChannel();
        const queue = 'thumbnail_processing';
        await channel.assertQueue(queue, { durable: true });
        console.log("listing for thumbnails");
        
        channel.consume(queue, async (msg) => {
            const photo_blob = msg.content;
            const photo_id = msg.properties.headers.photo_id;
            console.log("photo received");
            try {
                const thumbnail = await createthumbnail(photo_blob);
                console.log(thumbnail);
                const [ updated ] = await mysqlPool.query(`UPDATE photos SET thumbnail = ? WHERE id = ?`, [thumbnail, photo_id]);
                channel.ack(msg);
            } catch (error) {
                console.error('Error processing image:', error);
            }
        }, { noAck: false });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function createthumbnail(image_blob) {
    const thumbnail_buffer = await sharp(image_blob)
    .resize(100, 100)
    .toBuffer();

  return thumbnail_buffer;
}

// Start processing the queue
processqueue();