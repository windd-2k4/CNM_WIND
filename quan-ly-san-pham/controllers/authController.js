const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

module.exports = {
    getLoginPage: (req, res) => res.render('login'),

    login: async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await UserModel.findByUsername(username);
            if (!user) return res.render('login', { error: 'User không tồn tại' });

            // So sánh password hash
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.render('login', { error: 'Sai mật khẩu' });

            // Lưu vào session
            req.session.user = {
                username: user.username,
                role: user.role
            };
            res.redirect('/');
        } catch (err) {
            res.render('login', { error: 'Lỗi hệ thống' });
        }
    },

    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    },
    
    // (Optional) Tạo user mẫu để test. Bạn có thể tạo route riêng để gọi hàm này 1 lần.
    createSampleAdmin: async (req, res) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt); // Pass là 123456
        
        await UserModel.create({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        res.send("Đã tạo user admin/123456");
    }
};