// utils/generateReferenceNumber.js
const { Purchase } = require('../model');

async function generateUniqueReferenceNumber() {
    let referenceNumber;
    let isUnique = false;

    while (!isUnique) {
        referenceNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
        const existingPurchase = await Purchase.findOne({ where: { reference_number: referenceNumber } });
        if (!existingPurchase) {
            isUnique = true;
        }
    }

    return referenceNumber;
}

module.exports = generateUniqueReferenceNumber;
