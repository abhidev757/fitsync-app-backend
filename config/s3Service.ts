// 

import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Function to Upload Certificates
export const uploadCertificate = async (file: Express.Multer.File) => {
  return await uploadFileToS3(file, "certificates");
};

// Function to Upload Profile Images
export const uploadProfileImage = async (file: Express.Multer.File) => {
  return await uploadFileToS3(file, "profile-images");
};

// Generic Function to Upload Any File
const uploadFileToS3 = async (file: Express.Multer.File, folder: string) => {
  if (!file || !file.buffer) {
    throw new Error("File buffer is missing. Make sure multer is using memoryStorage.");
  }

  try {
    console.log(`📌 Uploading file: ${file.originalname} to ${folder}`);

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: `${folder}/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      },
    });

    const result = await upload.done();
    return { fileUrl: result.Location };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(`Failed to upload file to S3 (${folder})`);
  }
};
