const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.getLoginPage);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Route tạo user admin mẫu (Chạy 1 lần rồi comment lại)
router.get('/init-admin', authController.createSampleAdmin);

module.exports = router;