const mongoose = require("mongoose");
const Chat = mongoose.model("Chat");
const User = mongoose.model("User");
const Schema = mongoose.Schema;

exports.chat = (req, res, next, id) => {
	Chat.findById(id, (err, chat) => {
		if (err) {
			return next(err);
		}
		if (!chat) {
			return next(new Error("Failed to load chat: " + id));
		}
		req.chat = chat;
		next();
	});
};

exports.index = async (req, res) => {
	const chats = [];

	const chats1 = await Chat.find({
		user1: req.user._id
	})
		.populate("user2", "_id name username profileImage")
		.exec();
	chats1.forEach(chat => {
		chats.push(formatChat(chat));
	});

	const chats2 = await Chat.find({
		user2: req.user._id
	})
		.populate("user1", "_id name username profileImage")
		.exec();
	chats2.forEach(chat => {
		chats.push(formatChat(chat));
	});

	res.status(200).json({chats});

};

exports.show = (req, res) => {
	res.status(200).json({chat: req.chat});
};

exports.create = (req, res) => {
	if (req.user._id == req.profile._id) {
		return res.status(400).json({error: "You can't send a message to yourself"});
	}
	let type, message;
	Chat.betweenUsers(req.user._id, req.profile._id)
		.then(chat => {
			return new Promise(resolve => {
				if (req.files) {
					type = "image"
					const image = req.files.message;
					const basePath = __dirname + "/../../public/";
					const filePath = "img/uploads/messages/" + new Date().getTime() + "-" + image.name;
					image.mv(basePath + filePath, error => {
						if (!error) {
							resolve(chat);
						} else {
							res.status(500).json({error: err});
						}
					})
					message = filePath;
				} else {
					type = "message"
					message = req.body.message;
					resolve(chat);
				}
			});
		})
		.then(chat => {
			chat.addMessage(req.user._id, type, message);
			chat.save(err => {
				if (err) {
					res.status(500).json({error: err});
				} else {
					res.status(201).json({chat})
				}
			});
		});
};

// Sockets

function chatFilterLastMessage(chat) {
	chat.messages = [chat.messages[chat.messages.length - 1]];
	return chat;
}

function formatChat(chat) {
	return {
		_id: chat._id,
		user: chat.user1._id ? chat.user1 : chat.user2,
		messages: chat.messages,
		createdAt: chat.createdAt
	};
}

exports.message = async (socket, io, data) => {
	const {userId, message} = data;
	let chat = await Chat.betweenUsers(socket.user._id, userId);
	chat.addMessage(socket.user._id, "message", message);
	chat.save(async () => {
		chat = formatChat(chat);
		const user = await User.findById(userId).select("_id name username profileImage socket").exec();
		chat.user = user;
		chat = chatFilterLastMessage(chat);

		io.to(socket.user.socket).emit('message', {chat});
		io.to(chat.user.socket).emit('message', {chat});
	});
	console.log("message sent: ", message);
};