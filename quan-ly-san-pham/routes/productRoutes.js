const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middlewares/uploadMiddleware');
const { requireLogin, requireAdmin } = require('../middlewares/authMiddleware');

// --- CẬP NHẬT: Cho phép khách xem trang chủ (Bỏ requireLogin) ---
router.get('/', productController.getIndex);

// Các chức năng Admin vẫn cần bảo vệ nghiêm ngặt
router.get('/add', requireAdmin, productController.getAddPage);
router.post('/add', requireAdmin, upload.single('image'), productController.createProduct);

router.get('/edit/:id', requireAdmin, productController.getEditPage);
router.post('/edit/:id', requireAdmin, upload.single('image'), productController.updateProduct);

router.post('/delete/:id', requireAdmin, productController.deleteProduct);

module.exports = router;