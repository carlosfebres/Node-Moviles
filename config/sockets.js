const chat = require('../app/controllers/chat');
const socket = require('../app/controllers/socket');
const socketAuth = require('socketio-auth');

module.exports = io => {
	socketAuth(io, {
		authenticate: socket.authenticate,
		disconnect: socket.disconnect,
		postAuthenticate: socket => {
			socket.on("message", data => chat.message(socket, io, data))
		}
	});
};