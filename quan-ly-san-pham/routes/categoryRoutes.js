const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { requireLogin, requireAdmin } = require('../middlewares/authMiddleware');

// Chỉ Admin mới được quản lý danh mục
router.use(requireLogin);
router.use(requireAdmin);

router.get('/', categoryController.getList);
router.get('/add', categoryController.getAddPage);
router.post('/add', categoryController.create);
router.get('/edit/:id', categoryController.getEditPage);
router.post('/edit/:id', categoryController.update);
router.post('/delete/:id', categoryController.delete);

module.exports = router;