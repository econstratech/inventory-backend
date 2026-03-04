const axios = require('axios');

exports.GupShupMessage = (w_isd, number, appKey, source, templateId, templateParams) => {
    try {
        const recipientNumber = w_isd + number;
        const payload = {
            source: source,
            destination: recipientNumber,
            template: JSON.stringify({
                id: templateId,
                params: templateParams,
            }),
        };
        axios.post('https://api.gupshup.io/wa/api/v1/template/msg', payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': appKey,
            },
        }).then(response => {
       
        }).catch(error => {
            console.error('Error sending template message:', error.response ? error.response.data : error.message);
        });

        return { success: true, message: "Template message sent successfully" };

    } catch (error) {
        return { success: false, message: "Template message can not sent", data: error };
    }
}

exports.GupShupFileImage = (w_isd, number, appKey, source, templateId, templateParams) => {
    try {
        const recipientNumber = w_isd + number;
        const payload = {
            source: source,
            destination: recipientNumber,
            template: JSON.stringify({
                id: templateId,
                params: templateParams,
            }),
            message: JSON.stringify({ "type": "image", "image": { "link": "https://www.buildquickbots.com/whatsapp/media/sample/jpg/sample01.jpg" } })
        };
        axios.post('https://api.gupshup.io/wa/api/v1/template/msg', payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': appKey,
            },
        }).then(response => {
         
        }).catch(error => {
            console.error('Error sending template message:', error.response ? error.response.data : error.message);
        });

        return { success: true, message: "Template message sent successfully" };

    } catch (error) {
        return { success: false, message: "Template message can not sent", data: error };
    }
}


exports.GupShupFileDoc = (w_isd, number, appKey, source, templateId, templateParams) => {
    try {
        const recipientNumber = w_isd + number;
        const payload = {
            source: source,
            destination: recipientNumber,
            template: JSON.stringify({
                id: templateId,
                params: templateParams,
            }),
            message: JSON.stringify({ "type": "document", "document": { "link": "https://pdfobject.com/pdf/sample.pdf" } })
        };
        axios.post('https://api.gupshup.io/wa/api/v1/template/msg', payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': appKey,
            },
        }).then(response => {
          
        }).catch(error => {
            console.error('Error sending template message:', error.response ? error.response.data : error.message);
        });

        return { success: true, message: "Template message sent successfully" };

    } catch (error) {
        return { success: false, message: "Template message can not sent", data: error };
    }
}