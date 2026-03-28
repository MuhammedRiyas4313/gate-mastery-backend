const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary from existing ENV variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for schedule uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gate-mastery/schedules', // The folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx'],
    // Using a dynamic resource_type 'auto' allows Cloudinary to handle both images and non-image files (documents, pdfs)
    resource_type: 'auto' 
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
