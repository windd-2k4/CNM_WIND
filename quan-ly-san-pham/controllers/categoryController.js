const { v4: uuidv4 } = require('uuid');
const CategoryModel = require('../models/categoryModel');

module.exports = {
    // Xem danh sách Category
    getList: async (req, res) => {
        try {
            const categories = await CategoryModel.getAll();
            res.render('categories', { categories });
        } catch (err) {
            res.status(500).send("Lỗi lấy danh mục");
        }
    },

    // Trang thêm mới
    getAddPage: (req, res) => {
        res.render('category-form', { category: null });
    },

    // Xử lý thêm mới
    create: async (req, res) => {
        try {
            const { name, description } = req.body;
            await CategoryModel.save({
                categoryId: uuidv4(),
                name,
                description
            });
            res.redirect('/categories');
        } catch (err) {
            res.status(500).send("Lỗi thêm danh mục");
        }
    },

    // Trang sửa
    getEditPage: async (req, res) => {
        try {
            const category = await CategoryModel.getById(req.params.id);
            res.render('category-form', { category });
        } catch (err) {
            res.status(500).send("Lỗi trang sửa");
        }
    },

    // Xử lý cập nhật
    update: async (req, res) => {
        try {
            const { name, description } = req.body;
            await CategoryModel.save({
                categoryId: req.params.id,
                name,
                description
            });
            res.redirect('/categories');
        } catch (err) {
            res.status(500).send("Lỗi cập nhật");
        }
    },

    // Xóa danh mục
    delete: async (req, res) => {
        try {
            await CategoryModel.delete(req.params.id);
            res.redirect('/categories');
        } catch (err) {
            res.status(500).send("Lỗi xóa danh mục");
        }
    }
};