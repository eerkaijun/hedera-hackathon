const express = require('express');
const router = express.Router();
const cors = require('cors');
const cache = require('../model');
const axios = require('axios');

const { ProviderServiceClient, ProviderCredentials, CredentialsServiceClient, Credentials } = require('@trinsic/service-clients');
require('dotenv').config();


const providerClient = new ProviderServiceClient(
    new ProviderCredentials(process.env.PROVIDER_TOKEN),
    { noRetryPolicy: true });

const credentialClient = new CredentialsServiceClient(
    new Credentials(process.env.ACCESSTOK),
    { noRetryPolicy: true });
  
const getInvite = async () => {
  try {
    return await credentialClient.createConnection({});
  } catch (e) {
    console.log(e.message || e.toString());
  }
}

router.get('/first-time-verification', cors(), async function (req, res) {
  console.log("REQUEST INCOMING!");
  let payload = {
    "reference"    : `SP_REQUEST_${Math.random()}`,
    "callback_url" : "https://onboard-id.herokuapp.com/webhook",
    "email"        : "kaijuneer@gmail.com",
    "country"      : "MY",
    "language"	   : "EN",
    "redirect_url": "https://onboard-id.herokuapp.com/",
    
    "verification_mode" : "any",
    "document"         : {
    	"proof"           : "",
    	"supported_types" : ["id_card","driving_license","passport"],
    	"name"            : "",
    	"dob"			  : "",
    	"issue_date"      : "", 
    	"expiry_date"     : "",
    	"document_number" : ""
    }
  }

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + process.env.SHUFTI_TOKEN
  }

  //Dispatch request via fetch API or with whatever else which best suits for you
  const response = await axios.post('https://api.shuftipro.com/', payload,
  {
    headers : headers
  })
  console.log("RESPONSE FROM SHUFTI: ", response);
  res.status(200).send({ data: response.data});
})

router.get('/checkShuftiStatus', cors(), async function (req, res) {
  let payload = {
    "reference"    : req.query.reference
  }
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + process.env.SHUFTI_TOKEN
  }
  const response = await axios.post('https://api.shuftipro.com/status/', payload,
  {
    headers: headers
  })
  res.status(200).send({ data: response.data});
})
  
router.post('/issue', cors(), async function (req, res) {
  //const invite = await getInvite();
  //const attribs = JSON.stringify(req.body);
  //cache.add(invite.connectionId, attribs);
  let params = {
    definitionId: process.env.CRED_DEF_ID,
    connectionId: null,
    automaticIssuance: true,
    credentialValues: {
      "Name": req.body.name,
      "Passport Number": req.body.passport,
      "KYC Process Date": req.body.date
    }
  }
  let result = await credentialClient.createCredential(params);
  res.status(200).send({ invitation: result.offerUrl });
});

router.post('/verify', cors(), async function (req, res) {
  let verification = await credentialClient.createVerificationFromPolicy(process.env.POLICY_ID);

  res.status(200).send({
    verificationRequestData: verification.verificationRequestData,
    verificationRequestUrl: verification.verificationRequestUrl,
    verificationId: verification.verificationId
  });
});

router.get('/checkVerification', cors(), async function (req, res) {
  let verificationId = req.query.verificationId;
  let verification = await credentialClient.getVerification(verificationId);

  res.status(200).send({
    verification: verification
  });
});

router.post('/organizations', async function (req, res) {
  let params = {
    name: req.body.name,
    imageUrl: req.body.imageUrl,
    networkId: req.body.networkId,
    endorserType: req.body.endorserType,
    region: "UnitedStates"
  }
  await providerClient.createTenant(params);
  res.sendStatus(200);
});

router.delete('/organizations/:organizationId', async function (req, res) {
  let tenantId = req.params.organizationId;
  await providerClient.deleteTenant(tenantId);
  res.sendStatus(200);
});

router.get('/organizations/:organizationId', async function (req, res) {
  let result = await providerClient.getTenantKeys(req.params.organizationId);
  res.status(200).send(result);
});

router.get('/organizations', async function (req, res) {
  let tenants = await providerClient.listTenants();
  res.status(200).send(tenants);
});

router.patch('/organizations/:organizationId', async function (req, res) {
  let result = await providerClient.changeTenantKeys(req.params.organizationId);
  res.status(200).send(result);
});

module.exports = router;
