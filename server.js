const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const moment = require('moment');

const app = express();
app.use(bodyParser.json());

// Safaricom Sandbox credentials
const consumerKey = "uDRO6DrbBALnrmGGirOFe4GNfAAoXALeGvr5Kds66AcDAD5i";
const consumerSecret = "mpApxueWEpYhE9xedaGkta7k83fLpoEuPiNES6bhMaPi3rHiQaSWXdlsJRErcAcR";
const shortCode = "9514880";
const passkey = "12775367f40cd545f34d5ca77101622bf7c572fb3c6c287fef506ccea269e251";
const amount = 150; // Amount to test
const phoneNumber = "2547XXXXXXXX"; // Replace with sandbox test number
const callbackUrl = "https://YOUR-ONLINE-URL/stk-callback"; // Will be updated after deploy

let accessToken = '';

/* Generate Access Token */
async function generateToken() {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    try {
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${auth}` }
        });
        accessToken = response.data.access_token;
        console.log('Access Token generated:', accessToken);
    } catch (err) {
        console.error('Error generating token:', err.response.data);
    }
}

/* Trigger STK_Push */
app.get('/stk', async (req, res) => {
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

    const data = {
        "BusinessShortCode": shortCode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phoneNumber,
        "PartyB": shortCode,
        "PhoneNumber": phoneNumber,
        "CallBackURL": callbackUrl,
        "AccountReference": "TestPayment",
        "TransactionDesc": "Testing STK Push"
    };

    try {
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            data,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        res.json(response.data);
    } catch (err) {
        console.error('STK Push Error:', err.response.data);
        res.status(500).send(err.response.data);
    }
});

/* Handle STK Callback */
app.post('/stk-callback', (req, res) => {
    console.log('STK Callback received:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200); // Respond to Safaricom
});

/* Start Server */
const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await generateToken();
});
