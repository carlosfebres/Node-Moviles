const Mongoose = require("mongoose");
const User = Mongoose.model("User");

exports.authenticate = async (socket, data, callback) => {
	const {token} = data;
	try {
		const user = await User.findOne({token})
		if (user !== null && token.length) {
			socket.user = user;
			socket.user.socket = socket.id;
			socket.user.save();
			callback(null, true);
		} else {
			callback(null, false);
		}
	} catch (e) {
		callback(e);
	}
};

exports.disconnect = socket => {
	if (socket.user) {
		socket.user.socket = null;
		socket.user.save();
	}
}