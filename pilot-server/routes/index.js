const express = require('express');
const router = express.Router();
const { CredentialsServiceClient , Credentials } = require("@trinsic/service-clients");
const cache = require('../model');
require('dotenv').config();

const client = new CredentialsServiceClient(
    new Credentials(process.env.ACCESSTOK),
    { noRetryPolicy: true });


/* GET home page */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* Webhook endpoint */
router.post('/webhook', async function (req, res) {
  try {
    console.log("got webhook" + req + "   type: " + req.body.message_type);
    if (req.body.message_type === 'new_connection') {
      console.log("new connection notification");
      const attribs = cache.get(req.body.object_id)
      if (attribs) {
        let param_obj = JSON.parse(attribs);
        let params = {
          definitionId: process.env.CRED_DEF_ID,
          connectionId: req.body.object_id,
          automaticIssuance: true,
          credentialValues: {
            "Name": param_obj["name"],
            "Passport Number": param_obj["passport"],
            "KYC Process Date": param_obj["date"]
          }
        }
        await client.createCredential(params);
      }
    }
  }
  catch (e) {
    console.log(e.message || e.toString());
  }
});

module.exports = router;
