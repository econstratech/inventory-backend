const path = require("path");
const fs   = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

/**
 * Upload a single file to S3.
 * @param {object} file – The file object from multer.
 * @param {string} companyName – Company name to use in the folder path.
 * @returns {{status:boolean,message:string,url?:string,error?:any}}
 */
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_AccessKeyId,
        secretAccessKey: process.env.AWS_SecretAccessKey
    }
});
 
exports.UploadFileToAWS = async (file, companyName) => {
 
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const currentMonth = `${month}-${year}`;
 
    const folderName = companyName.replace(/\s+/g, '-');
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = file.path;
 
    try {
        const fileContent = fs.readFileSync(filePath);
 
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `ERP/${folderName}/${currentMonth}/${fileName}`,
            Body: fileContent,
        };
 
        const command = new PutObjectCommand(params);
        await s3.send(command);
 
        // Clean up local temp file
        fs.unlinkSync(filePath);
 
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folderName}/${currentMonth}/${fileName}`;
 
        return { status: true, url: fileUrl };
 
    } catch (err) {
        return { status: false, message: "File does not be uploaded !" };
    }
}