const cron = require('node-cron');
const { GetLowQtyProducts, GetOverStockProducts } = require('../controller/ProductController');


// You can also log this to a file or use a logger
function fakeReqResWrapper(fn, name) {
    fn(
        { user: {} }, // Mocked req (modify if you require user/company_id)
        {
            status: (code) => ({
                json: (data) => console.log(`[${name}] Response ${code}:`, data),
            }),
        }
    );
}


cron.schedule('0 9 * * *', () => {
    console.log("📦 Running Low Stock Alert (cron)");
    fakeReqResWrapper(GetLowQtyProducts, "LowStock");
});

cron.schedule('0 10 * * *', () => {
    console.log("📦 Running Over Stock Alert (cron)");
    fakeReqResWrapper(GetOverStockProducts, "OverStock");
});
