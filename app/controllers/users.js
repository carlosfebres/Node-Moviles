const Mongoose = require("mongoose");
const Tweet = Mongoose.model("Tweet");
const User = Mongoose.model("User");
const randToken = require('rand-token');

exports.signin = (req, res) => {
};

exports.authCallback = (req, res) => {
	res.redirect("/");
};

const validatePresenceOf = value => value && value.length;

exports.getList = async (req, res) => {
	let users = [];
	for (let x in req.body.ids) {
		let user = await User.findById(req.body.ids[x]).exec();
		users.push(user);
	}
	res.status(200).json({users});
};

exports.getByUsername = async (req, res) => {
	res.status(200).json({user: req.profile});
};

exports.logged = async (req, res) => {
	res.status(200).json({user: req.user});
};

exports.search = (req, res) => {
	if (!validatePresenceOf(req.body.search)) {
		return res.status(400).json({error: "Invalid Input"})
	}
	User.find({
		$or: [
			{
				name: new RegExp(req.body.search, 'ig')
			},
			{
				username: new RegExp(req.body.search, 'ig')
			}
		]
	}, (err, users) => {
		res.status(200).json(users)
	});
};

exports.update = (req, res) => {
	User.findOne({
		_id: req.user._id
	}, (err, user) => {
		user.name = req.body.name;
		user.email = req.body.email;
		user.username = req.body.username;
		user.save(err => {
			if (err)
				res.status(400).json({error: err});
			else
				res.status(200).json({user: user});
		});
	})
};

exports.login = (req, res) => {
	if (!validatePresenceOf(req.body.email) || !validatePresenceOf(req.body.password)) {
		return res.status(400).json({error: "Invalid Input"})
	}
	let token = randToken.uid(64);
	User.findOne({email: req.body.email}, (error, user) => {
		if (user) {
			console.log(user);
			if (user.authenticate(req.body.password)) {
				user.token = token;
				user.save(error => {
					console.log(error);
					console.log("User: ", user);
					res.status(200).json({user});
				})
			} else {
				res.status(400).json({error: "Invalid Password"});
			}
		} else {
			res.status(404).json({error: "User not found"})
		}
	})
}


exports.signup = (req, res) => {
	console.log(req.body);
	let user = new User(req.body);
	user.save((error, f) => {
		if (error) {
			console.log(error);
			res.status(400).json({error})
		} else
			res.status(200).json({user})
	});
};

exports.logout = (req, res) => {
	req.logout();
	res.json({});
};

exports.getTweets = (req, res) => {
	const user = req.profile;
	Tweet.find({user: user._id})
		.populate("comments.user")
		.exec((err, tweets) => {
			res.json({tweets});
		});
}

exports.show = (req, res) => {
	const user = req.profile;
	const reqUserId = user._id;
	const userId = reqUserId.toString();
	const page = (req.query.page > 0 ? req.query.page : 1) - 1;
	const options = {
		perPage: 100,
		page: page,
		criteria: {user: userId}
	};
	let tweets, tweetCount;
	let followingCount = user.following.length;
	let followerCount = user.followers.length;

	Tweet.list(options)
		.then(result => {
			tweets = result;
			return Tweet.countUserTweets(reqUserId);
		})
		.then(result => {
			tweetCount = result;
			res.json({
				user: user,
				tweets: tweets,
				tweetCount: tweetCount,
				followerCount: followerCount,
				followingCount: followingCount
			});
		})
		.catch(error => {
			return res.json({errors: error.errors});
		});
};

exports.user = (req, res, next, id) => {
	User.findOne({_id: id}).exec((err, user) => {
		if (err) {
			return next(err);
		}
		if (!user) {
			return next(new Error("failed to load user " + id));
		}
		req.profile = user;
		next();
	});
};

exports.username = (req, res, next, username) => {
	User.findOne({username: username}).exec((err, user) => {
		if (err) {
			return next(err);
		}
		if (!user) {
			return next(new Error("failed to load user @" + username));
		}
		req.profile = user;
		next();
	});
};


exports.code = (req, res) => {
	console.log("In");
	const user = req.user;
	const code = Math.round(Math.random() * Math.pow(10, 6));
	user.code = code + "";
	user.codeSent = false;
	user.save(err => {
		res.json({});
	});
};

exports.verifyCode = (req, res) => {
	const user = req.user;
	console.log(user.code, req.body.code);
	console.log(user.code == req.body.code);
	if (user.code == req.body.code) {
		user.mobileVerified = true;
		user.save(err => {
			res.json({valid: true});
		});
	} else {
		res.json({valid: false});
	}
}

exports.get_sms = (req, res) => {
	User.find({
		codeSent: false,
		mobileVerified: false,
		code: {
			$exists: true
		}
	}, (err, users) => {
		users.forEach(user => {
			user.codeSent = true;
			user.save(err => {
			});
		})
		const codes = users.map(e => ({code: e.code, number: e.mobile}));
		console.log(codes);
		res.json(codes);
	});
}

exports.setCode = (req, res) => {
	const user = req.user;
	const code = Math.round(Math.random() * Math.pow(10, 6));
	user.code = code;
	user.save(err => {
		res.json({});
	});
};

exports.setPhoto = (req, res) => {
	const user = req.user;
	if (req.files) {
		const image = req.files.image;
		const basePath = __dirname + "/../../public/";
		const filePath = "img/uploads/profile/" + new Date().getTime() + "-" + image.name;
		user.profileImage = filePath;
		image.mv(basePath + filePath, error => {
			if (!error) {
				user.save(err => {
					if (err) {
						res.status(500).json({error: err});
					} else {
						res.status(200).json({user});
					}
				});
			} else {
				res.status(500).json({error: err});
			}
		})
	} else {
		res.status(400).json({error: "No Photo sent."});
	}
};

exports.showFollowers = (req, res) => {
	showFollowers(req, res, "followers");
};

exports.showFollowing = (req, res) => {
	showFollowers(req, res, "following");
};

exports.getByPhones = async (req, res) => {
	const users = await User.find({
		mobile: {
			$in: req.body.numbers
		}
	}).exec();

	res.status(200).json({users});
};

function showFollowers(req, res, type) {
	let user = req.profile;
	let followers = user[type];
	let tweetCount;
	let followingCount = user.following.length;
	let followerCount = user.followers.length;
	let userFollowers = User.find({_id: {$in: followers}}).populate(
		"user",
		"_id name username github"
	);

	Tweet.countUserTweets(user._id).then(result => {
		tweetCount = result;
		userFollowers.exec((err, users) => {
			if (err) {
				return res.render("pages/500");
			}
			res.render("pages/followers", {
				user: user,
				followers: users,
				tweetCount: tweetCount,
				followerCount: followerCount,
				followingCount: followingCount
			});
		});
	});
}
