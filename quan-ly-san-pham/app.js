require('dotenv').config();
const express = require('express');
const session = require('express-session');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = 3000;

// Cấu hình View Engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware xử lý body và form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình Session (QUAN TRỌNG)
app.use(session({
    secret: 'chuoi-bi-mat-cua-ban-123', // Thay bằng chuỗi ngẫu nhiên
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 giờ
}));

// Middleware toàn cục: Truyền biến `user` xuống tất cả các View
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Đăng ký Routes
app.use('/', authRoutes);      // Xử lý login/logout
app.use('/categories', categoryRoutes); // Xử lý danh mục
app.use('/', productRoutes);   // Xử lý sản phẩm (Trang chủ)

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});