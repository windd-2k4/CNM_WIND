const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('../config/aws');

const TABLE_NAME = "Users"; // Nhớ tạo bảng này trên AWS

const UserModel = {
    findByUsername: async (username) => {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: { username }
        });
        const result = await docClient.send(command);
        return result.Item;
    },

    create: async (user) => {
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: user
        });
        await docClient.send(command);
    }
};
module.exports = UserModel;