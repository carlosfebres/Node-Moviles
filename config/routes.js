const express = require("express");
const router = express.Router();

const users = require("../app/controllers/users");
const chat = require("../app/controllers/chat");
const tweets = require("../app/controllers/tweets");
const comments = require("../app/controllers/comments");
const favorites = require("../app/controllers/favorites");
const follows = require("../app/controllers/follows");

module.exports = (app, passport, auth) => {

	app.use("/", router);

	/**
	 * Main unauthenticated routes
	 */
	router.post("/login", users.login)
	router.post("/signup", users.signup);
	router.get("/logout", users.logout);

	/**
	 * Catch Bearer Token middleware
	 */
	router.use(passport.authenticate('bearer', {session: false}));

	/**
	 * Authentication middleware
	 * All routes specified after this middleware require authentication in order
	 * to access
	 */
	router.use(auth.requiresLogin);

	/**
	 * Home route
	 */
	router.get("/dashboard/:page", tweets.dashboard);

	/**
	 * Code
	 */
	router.get('/server/get_sms', users.get_sms);
	router.get('/verification/code', users.code);
	router.post('/verify', users.verifyCode);

	/**
	 * Solve Params
	 */
	router.param("userId", users.user);
	router.param("username", users.username);

	/**
	 * User routes
	 */
	router.route("/user")
		.get(users.logged)
		.put(users.update);

	router.post("/user/getList", users.getList);
	router.get("/user/:username", users.getByUsername);

	router.get("/user/:userId/tweets", users.getTweets);
	router.post("/user/search", users.search);

	/**
	 * Add or change profile picture
	 */
	router.post("/user/photo", users.setPhoto);

	/**
	 * Follow and UnFollow
	 */
	router.route("/user/:userId/follow")
		.post(follows.follow)
		.delete(follows.unfollow);

	router.post('/users/phone', users.getByPhones)

	/**
	 * Chat routes
	 */
	router.param("idChat", chat.chat);
	router.get("/chats", chat.index);
	router.get("/chat/:idChat", chat.show);
	router.post("/message/:userId", chat.create);


	/**
	 * Tweet routes
	 */
	router.post("/tweets", tweets.create);


	/**
	 * Comment routes
	 */
	router.param("idTweet", tweets.tweet);
	router.post("/tweets/:idTweet/comments", comments.create)
	router.delete("/tweets/:idTweet/comment/:idComment", comments.delete)

	/**
	 * Favorite routes
	 */
	router
		.route("/tweets/:idTweet/favorites")
		.get(favorites.create)
		.delete(favorites.destroy);

	/**
	 * Page not found route (must be at the end of all routes)
	 */
	router.use((req, res) => {
		res.status(404).json({
			url: req.originalUrl,
			error: "Not found"
		});
	});
};
