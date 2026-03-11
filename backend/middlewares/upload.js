const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('创建上传目录:', uploadDir);
}

// 配置存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('保存文件到目录:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'avatar-' + uniqueSuffix + ext;
        console.log('生成文件名:', filename);
        cb(null, filename);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    console.log('收到文件:', file.originalname, '类型:', file.mimetype);
    // 接受所有图片类型
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        console.log('拒绝文件:', file.originalname, '类型不是图片');
        cb(new Error('只支持图片文件'), false);
    }
};

// 创建multer实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
}).single('avatar');

module.exports = upload;