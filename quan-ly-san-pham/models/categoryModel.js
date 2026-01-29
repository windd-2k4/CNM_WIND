const { ScanCommand, PutCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('../config/aws');
const TABLE_NAME = "Categories"; // Nhớ tạo bảng

module.exports = {
    getAll: async () => {
        const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        return data.Items || [];
    },
    save: async (item) => {
        return await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    },
    delete: async (id) => {
        return await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { categoryId: id } }));
    }
};