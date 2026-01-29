// middlewares/uploadMiddleware.js
const multer = require('multer');

// Cấu hình lưu trữ: MemoryStorage (Lưu vào RAM để xử lý trước khi đẩy lên S3)
const storage = multer.memoryStorage();

// Bộ lọc file (Chỉ cho phép ảnh)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép upload file ảnh!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

module.exports = upload;