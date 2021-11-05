"use strict";

const line = require("@line/bot-sdk");
const express = require("express");
const serverless = require('serverless-http');
require('dotenv').config();
const GAS = require('./GASPost');

const router = express.Router();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);
const gas = new GAS();

const app = express();

router.post("/linebot", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  let echo = [];
  if (event.type === 'beacon') {
    if (event.beacon.type === 'enter') {
        console.log(event.source.userId)
        let name = '';
        await gas.post(event.source.userId).then(function (ret) {
            name = ret;
        });
        echo = { 'type': 'text', 'text': `こんにちは ${name} さん！` };
        return client.replyMessage(event.replyToken, echo);
    }
    return;
  } else if (event.type === 'follow') {
    return;
  } else {
    echo = { 'type': 'text', 'text': '申し訳ありませんが、お返事できません。' }; 
  }

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// サーバを起動する
app.use('/.netlify/functions/index', router);
module.exports = app;
module.exports.handler = serverless(app);