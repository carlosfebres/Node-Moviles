const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.unfollow = (req, res) => {
	let index;
	const user = req.user;

	index = req.profile.followers.indexOf(user.id);
	if (index >= 0) {
		req.profile.followers.splice(index, 1);
		req.profile.save();
	}

	index = user.following.indexOf(req.profile._id);
	if (index >= 0) {
		user.following.splice(index, 1);
		user.save();
	}
	res.status(201).send({});

}

exports.follow = (req, res) => {
	const user = req.user;

	if (req.profile.followers.indexOf(user.id) === -1) {
		req.profile.followers.push(user.id);
	}
	req.profile.save(err => {
		if (err) {
			logger.error(err);
		}
	});

	if (user.following.indexOf(req.profile._id) === -1) {
		user.following.push(req.profile._id);
	}
	user.save(err => {
		if (err) {
			res.status(400);
		}
		res.status(201).send({});
	});
};
