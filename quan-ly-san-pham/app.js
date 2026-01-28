require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// AWS SDK v3
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const app = express();
const PORT = 3000;

// Cấu hình Middleware
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình AWS
const awsConfig = {
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
};

const s3Client = new S3Client(awsConfig);
const ddbClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Cấu hình upload file (Lưu vào RAM trước khi lên S3)
const upload = multer({ storage: multer.memoryStorage() });

// --- CHỨC NĂNG HỖ TRỢ ---
// Hàm upload ảnh lên S3
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

// Hàm lấy tên file từ URL (để xóa S3)
function getKeyFromUrl(url) {
    if (!url) return null;
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1]; // Lấy phần cuối cùng của URL
}

// --- ROUTES ---

// 1. READ - Trang chủ: Danh sách sản phẩm
app.get('/', async (req, res) => {
    try {
        const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        res.render('index', { products: data.Items || [] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi lấy dữ liệu từ DynamoDB");
    }
});

// 2. CREATE - Trang thêm sản phẩm
app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, price, quantity } = req.body;
        let imageUrl = "";

        if (req.file) {
            imageUrl = await uploadToS3(req.file);
        }

        const newProduct = {
            id: uuidv4(),
            name: name,
            price: Number(price),
            quantity: Number(quantity),
            url_image: imageUrl
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: newProduct
        }));

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi thêm sản phẩm");
    }
});

// 3. DELETE - Xóa sản phẩm & Xóa ảnh trên S3
app.post('/delete/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        // Bước 1: Lấy thông tin sản phẩm để lấy URL ảnh
        const productData = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { id: productId }
        }));

        const product = productData.Item;

        // Bước 2: Nếu có ảnh, xóa trên S3
        if (product && product.url_image) {
            const imageKey = getKeyFromUrl(product.url_image);
            if (imageKey) {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: imageKey
                }));
                console.log("Đã xóa ảnh trên S3:", imageKey);
            }
        }

        // Bước 3: Xóa trong DynamoDB
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id: productId }
        }));

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi khi xóa sản phẩm");
    }
});

// 4. UPDATE - Trang chỉnh sửa
app.get('/edit/:id', async (req, res) => {
    try {
        const data = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { id: req.params.id }
        }));
        
        if (!data.Item) {
            return res.status(404).send("Sản phẩm không tồn tại");
        }
        res.render('edit', { product: data.Item });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi tải trang sửa");
    }
});

app.post('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, quantity, current_image } = req.body;
        let imageUrl = current_image; // Mặc định giữ ảnh cũ

        // Nếu người dùng upload ảnh mới
        if (req.file) {
            // 1. Upload ảnh mới
            imageUrl = await uploadToS3(req.file);
            
            // 2. (Optional) Xóa ảnh cũ để tiết kiệm dung lượng S3
            const oldImageKey = getKeyFromUrl(current_image);
            if (oldImageKey) {
                try {
                    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldImageKey }));
                } catch (e) { console.log("Không thể xóa ảnh cũ hoặc ảnh không tồn tại"); }
            }
        }

        // Cập nhật lại DynamoDB (Ghi đè Item cũ)
        const updatedProduct = {
            id: req.params.id, // Giữ nguyên ID
            name: name,
            price: Number(price),
            quantity: Number(quantity),
            url_image: imageUrl
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: updatedProduct
        }));

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi cập nhật sản phẩm");
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});