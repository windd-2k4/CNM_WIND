const { ScanCommand, PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('../config/aws');
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

const ProductModel = {
    getAll: async () => {
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            // FilterExpression: Chỉ lấy item chưa bị xóa (Soft Delete)
            FilterExpression: "attribute_not_exists(isDeleted) OR isDeleted = :deleted",
            ExpressionAttributeValues: { ":deleted": false }
        });
        const result = await docClient.send(command);
        return result.Items || [];
    },

    getById: async (id) => {
        const command = new GetCommand({ TableName: TABLE_NAME, Key: { id } });
        const result = await docClient.send(command);
        return result.Item;
    },

    save: async (productItem) => {
        // Luôn đảm bảo có trường isDeleted = false khi tạo mới
        productItem.isDeleted = false;
        productItem.createdAt = new Date().toISOString();
        
        const command = new PutCommand({ TableName: TABLE_NAME, Item: productItem });
        return await docClient.send(command);
    },

    // Soft Delete: Không dùng DeleteCommand nữa, dùng UpdateCommand
    softDelete: async (id) => {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id: id },
            UpdateExpression: "set isDeleted = :deleted",
            ExpressionAttributeValues: { ":deleted": true }
        });
        return await docClient.send(command);
    }
};
module.exports = ProductModel;