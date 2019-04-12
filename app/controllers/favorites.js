
// ### Create Favorite
exports.create = (req, res) => {
	req.tweet.favorites.push(req.user);
	req.tweet.save(err => {
		if (err) {
			return res.status(400).json({error: "Server Error"});
		}
		res.send(201, {});
	});
};

// ### Delete Favorite
exports.destroy = (req, res) => {
	let index = req.tweet.favorites.indexOf(req.user._id);
	if (index >= 0) {
		req.tweet.favorites.splice(index, 1);
		req.tweet.save(err => {
			if (err) {
				return res.status(400).json({error: "Server Error"});
			}
			res.send(201, {});
		});
	} else {
		res.send(201, {});
	}
};
