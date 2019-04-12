const express = require("express");
const session = require("express-session");
const errorHandler = require("errorhandler");
const mongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const Raven = require("raven");
const moment = require("moment");
const cors = require('cors');
const fileUpload = require('express-fileupload');

module.exports = (app, config, passport) => {

	app.set("showStackError", true);
	app.locals.moment = moment;

	// setup Sentry to get any crashes
	if (process.env.SENTRY_DSN !== null) {
		Raven.config(process.env.SENTRY_DSN).install();
		app.use(Raven.requestHandler());
		app.use(Raven.errorHandler());
	}

	app.use(cors());
	app.use(fileUpload());
	app.use(express.static(config.root + "/public"));

	if (process.env.NODE_ENV === "development") {
		app.use(errorHandler());
		app.locals.pretty = true;
	}

	app.use(cookieParser());
	app.use(
		bodyParser.urlencoded({
			extended: true
		})
	);
	app.use(bodyParser.json());
	app.use(methodOverride("_method"));
	app.use(
		session({
			secret: 'car@los123',
			resave: false,
			saveUninitialized: false,
			store: new mongoStore({
				url: config.db,
				collection: "sessions"
			})
		})
	);

	app.use(flash());
	app.use(passport.initialize());
	app.use(passport.session());

	app.use((err, req, res, next) => {
		if (err.message.indexOf("not found") !== -1) {
			return next();
		}
		console.log(err.stack);

		res.status(500).json({error: err.stack, message: "Server Error"});
	});
};
