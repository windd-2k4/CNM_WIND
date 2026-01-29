const { v4: uuidv4 } = require('uuid');
const { Upload } = require("@aws-sdk/lib-storage");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require('../config/aws');
const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel'); // Import thêm

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function uploadToS3(file) {
    const fileKey = `${uuidv4()}-${file.originalname}`;
    const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    const parallelUploads3 = new Upload({ client: s3Client, params: uploadParams });
    await parallelUploads3.done();
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
}

module.exports = {
    getIndex: async (req, res) => {
        try {
            let products = await ProductModel.getAll();
            const categories = await CategoryModel.getAll();

            // 1. FILTER: Lọc dữ liệu theo Query String
            const { search, category, minPrice, maxPrice, page = 1 } = req.query;

            if (search) {
                products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
            }
            if (category) {
                products = products.filter(p => p.categoryId === category);
            }
            if (minPrice) products = products.filter(p => p.price >= Number(minPrice));
            if (maxPrice) products = products.filter(p => p.price <= Number(maxPrice));

            // 2. MAP: Ghép tên Category vào Product
            const categoryMap = {};
            categories.forEach(c => categoryMap[c.categoryId] = c.name);

            products = products.map(p => ({
                ...p,
                categoryName: categoryMap[p.categoryId] || 'Chưa phân loại'
            }));

            // 3. PAGINATION: Phân trang
            const limit = 5;
            const totalPages = Math.ceil(products.length / limit);
            const currentPage = Number(page);
            const startIndex = (currentPage - 1) * limit;
            const paginatedProducts = products.slice(startIndex, startIndex + limit);

            res.render('index', { 
                products: paginatedProducts, 
                categories,
                query: req.query,
                totalPages,
                currentPage
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi Server");
        }
    },

    getAddPage: async (req, res) => {
        const categories = await CategoryModel.getAll();
        res.render('add', { categories }); // Truyền category sang view để chọn
    },

    createProduct: async (req, res) => {
        try {
            const { name, price, quantity, categoryId } = req.body;
            let imageUrl = "";

            if (req.file) {
                imageUrl = await uploadToS3(req.file);
            }

            const newProduct = {
                id: uuidv4(),
                name,
                price: Number(price),
                quantity: Number(quantity),
                categoryId, // Lưu ID danh mục
                url_image: imageUrl,
                isDeleted: false,
                createdAt: new Date().toISOString()
            };

            await ProductModel.save(newProduct);
            res.redirect('/');
        } catch (err) {
            console.log(err);
            res.status(500).send("Lỗi thêm mới");
        }
    },

    getEditPage: async (req, res) => {
        try {
            const product = await ProductModel.getById(req.params.id);
            const categories = await CategoryModel.getAll();
            if (!product) return res.status(404).send("Không tìm thấy");
            
            res.render('edit', { product, categories });
        } catch (err) {
            res.status(500).send("Lỗi tải trang sửa");
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { name, price, quantity, categoryId, current_image } = req.body;
            let imageUrl = current_image;

            if (req.file) {
                imageUrl = await uploadToS3(req.file);
            }

            const updatedProduct = {
                id: req.params.id,
                name,
                price: Number(price),
                quantity: Number(quantity),
                categoryId,
                url_image: imageUrl,
                isDeleted: false
            };

            await ProductModel.save(updatedProduct);
            res.redirect('/');
        } catch (err) {
            res.status(500).send("Lỗi cập nhật");
        }
    },

    deleteProduct: async (req, res) => {
        try {
            // Sử dụng Soft Delete thay vì xóa thật
            await ProductModel.softDelete(req.params.id);
            res.redirect('/');
        } catch (err) {
            res.status(500).send("Lỗi xóa");
        }
    }
};