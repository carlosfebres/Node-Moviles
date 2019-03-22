// ## Tweet Controller
const createPagination = require("./analytics").createPagination;
const mongoose = require("mongoose");
const Tweet = mongoose.model("Tweet");
const User = mongoose.model("User");
const Analytics = mongoose.model("Analytics");
const _ = require("underscore");
const logger = require("../middlewares/logger");

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
		const basePath = __dirname+"/../../public/";
		const filePath = "img/uploads/tweets/"+new Date().getTime()+"-"+image.name;
		tweet.image = filePath;
		image.mv(basePath+filePath, error => {
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

// ### Update a tweet
exports.update = (req, res) => {
	let tweet = req.tweet;
	tweet = _.extend(tweet, {body: req.body.tweet});
	tweet.uploadAndSave({}, err => {
		if (err) {
			return res.render("pages/500", {error: err});
		}
		res.redirect("/");
	});
};

// ### Delete a tweet
exports.destroy = (req, res) => {
	const tweet = req.tweet;
	tweet.remove(err => {
		if (err) {
			return res.status(500).json({"error": "Server error"});
		}
		res.status(200).json({});
	});
};

exports.index = (req, res) => {
	const page = (req.query.page > 0 ? req.query.page : 1) - 1;
	const perPage = 5;
	let tweets;
	const criteria = {
		user: req.user.following
	};
	Tweet.list({
		perPage,
		page,
		criteria
	})
		.then(result => {
			tweets = result;
			return Tweet.countTotalTweets(criteria);
		})
		.then( totalTweets => {
			res.json({
				title: "List of Tweets",
				tweets: tweets,
				page: page + 1,
				pages: Math.ceil(totalTweets / perPage)
			});
		})
		.catch(error => {
			logger.error(error);
			res.status(500).json({"error": "Server error"});
		});
};
