const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
	{
		messages: [
			{
				type: {type: String},
				message: {type: String, default: "", trim: true},
				sentBy: {type: Schema.ObjectId, ref: "User"},
				sentAt: {type: Date, default: Date.now}
			}
		],
		user1: {type: Schema.ObjectId, ref: "User"},
		user2: {type: Schema.ObjectId, ref: "User"},
		createdAt: {type: Date, default: Date.now}
	},
	{usePushEach: true}
);

ChatSchema.statics = {
	betweenUsers: function (from, to) {
		return new Promise((resolve, reject) => {
			this.findOne({
				$or: [
					{user1: from, user2: to},
					{user1: to, user2: from}
				]
			}, (err, chat) => {
				if (err) {
					console.log(err);
					reject(err);
				}
				if (!chat) {
					chat = new this({
						user1: from,
						user2: to
					});
				}
				resolve(chat);
			});
		});
	}
};

ChatSchema.methods = {
	addMessage: function (user, type, message) {
		this.messages.push({
			type: type,
			message: message,
			sentBy: user
		});
	}
};

mongoose.model("Chat", ChatSchema);
