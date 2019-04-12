// ## Tweet Controller
const mongoose = require("mongoose");
const Tweet = mongoose.model("Tweet");

exports.tweet = (req, res, next, id) => {
	Tweet.load(id, (err, tweet) => {
		if (err) {
			return next(err);
		}
		if (!tweet) {
			return next(new Error("Failed to load tweet: " + id));
		}
		req.tweet = tweet;
		next();
	});
};

// ### Create a Tweet
exports.create = (req, res) => {
	const tweet = new Tweet(req.body);
	tweet.user = req.user;
	if (req.files) {
		const image = req.files.image;
		const basePath = __dirname + "/../../public/";
		tweet.image = "img/uploads/tweets/" + new Date().getTime() + "-" + image.name;
		image.mv(basePath + tweet.image, error => {
			if (!error) {
				tweet.uploadAndSave({}, err => {
					if (err) {
						res.status(500).json({error: err});
					} else {
						res.status(200).json({tweet: tweet});
					}
				});
			} else {
				res.status(500).json({error: err});
			}
		})
	} else {
		tweet.uploadAndSave({}, err => {
			if (err) {
				res.status(500).json({error: err});
			} else {
				res.status(200).json({tweet: tweet});
			}
		});
	}
};

// ### Delete a tweet
exports.destroy = (req, res) => {
	req.tweet.remove();
	res.status(200).json({});

};

exports.dashboard = async (req, res) => {

	const pageNum = (req.params.page > 1 ? req.params.page - 1: 0);
	const perPage = 5;
	const criteria = {user: {$in: req.user.following}};

	try {
		const tweets = await Tweet.list({
			perPage,
			page: pageNum,
			criteria
		});

		const totalTweets = await Tweet.countTotalTweets(criteria);

		res.json({
			tweets: tweets,
			page: pageNum + 1,
			pages: Math.ceil(totalTweets / perPage)
		});
	} catch (error) {
		res.status(500).json({"msg": "Server error", error});
	}
};
