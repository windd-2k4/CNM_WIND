// middlewares/authMiddleware.js
module.exports = {
    requireLogin: (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        next();
    },
    
    requireAdmin: (req, res, next) => {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send("Bạn không có quyền truy cập (Chỉ Admin).");
        }
        next();
    }
};