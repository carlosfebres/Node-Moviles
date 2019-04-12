const mongoose = require("mongoose");
const User = mongoose.model("User");
const BearerStrategy = require('passport-http-bearer').Strategy;


module.exports = (passport, config) => {

	// serialize sessions
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
		User.findOne({_id: id}, (err, user) => {
			done(err, user);
		});
	});

	passport.use(new BearerStrategy(
		function (token, done) {
			User.findOne({token: token}, function (err, user) {
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false);
				}
				return done(null, user, {scope: 'all'});
			});
		}
	));

};
