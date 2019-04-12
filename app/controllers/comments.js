//@ts-check
const utils = require("../../lib/utils");
const mongoose = require("mongoose");
const Tweet = mongoose.model("Tweet");

exports.load = (req, res, next, id) => {
  const tweet = req.tweet;
  utils.findByParam(tweet.comments, { id: id }, (err, comment) => {
    if (err) {
      return next(err);
    }
    req.comment = comment;
    next();
  });
};

// ### Create Comment
exports.create = (req, res) => {
  const user = req.user;
  if (!req.body.comment || !req.body.tweet) {
	  return res.status(500).json({error:"Invalid Input"});
  }
  Tweet.findById(req.body.tweet, (error,tweet) => {
	  tweet.addComment(user, req.body.comment, (err) => {
		  if (err) {
			  logger.error(err);
			  return res.status(500).json({error:"Server Error"});
		  }
		  let comment = tweet.comments[tweet.comments.length-1];
		  res.status(200).json({msg:"Comment added!",comment:comment});
	  });
  })
};

// ### Delete Comment
exports.delete = (req, res) => {
  // delete a comment here.
  const comment_id = req.params.comment_id;
  const tweet = req.tweet;
  for (let x in tweet.comments) {
  	if (tweet.comments[x]._id == comment_id) {
  		tweet.comments.splice(x,1);
  		tweet.save(err=>{
			res.status(200).json({msg:"Deleted"});
		})

  		break;
	}
  }
};
