// const whatsappNotification = 
const axios = require('axios');
const nodemailer = require('nodemailer');


//Greenapi send sms
const instanceId = '7103893304';
const apiToken = '337124c03a22467f9aab2503be522b2d93fc9761cf8a4ca68d';
const url = `https://api.greenapi.com/waInstance${instanceId}/sendMessage/${apiToken}`;

exports.GreenApiWhatsappNotification = async (phoneNumber, message) => {
    try {
        const response = await axios.post(url, {
            chatId: `${phoneNumber}@c.us`,
            message: message
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.log('Error sending message:', error.response ? error.response.data : error.message);
    }
}


//Maytapiwhatsapp send sms
const API_URL = 'https://api.maytapi.com/api';
const PRODUCT_ID = 'e7922817-9a12-42e0-b7d9-eae60ba279b8';
const PHONE_ID = '49934';
const API_TOKEN = 'a5e6ddf3-3e5d-4f5d-ad9c-74f80a97dd7d';

exports.MaytapiWhatsappNotification = async (phoneNumber, message) => {
    try {
        const response = await axios.post(`${API_URL}/${PRODUCT_ID}/${PHONE_ID}/sendMessage`, {
            to_number: phoneNumber,
            type: 'text',
            message: message
        }, {
            headers: {
                'x-maytapi-key': API_TOKEN
            }
        });

        console.log('Message sent:', response.data);
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
}

//send email 
exports.sendMail = async (to, subject, html, attachments = []) => {

    var transporter = nodemailer.createTransport({
        host: "bulk.smtp.mailtrap.io",
        port: 587,
        auth: {
            user: "api",
            pass: "da057933578f3a6ff62a852dcc135b5d"
        }
    });
   const fromAddresses = [
    'ERP-System@growthh.com',
    'no-reply@growthh.com',
    'growthh-ERP@growthh.com',
    'Software@growthh.com'
];

// Randomly pick one address
const from = fromAddresses[Math.floor(Math.random() * fromAddresses.length)];

const mailOptions = {
    from,
    to,
    subject,
    html,
    attachments
};
    try {
        const info = await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
        });
        return "success";
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
   
};




const TALLY_URL = "http://localhost:9000";

// Helper function to send XML request to Tally
exports.sendToTally = async (xmlRequest) => {
    try {
        const response = await axios.post(TALLY_URL, xmlRequest, {
            headers: { "Content-Type": "text/xml" },
        });
        return response.data;
    } catch (error) {
        console.error("Error communicating with Tally:", error);
        throw error;
    }
};


