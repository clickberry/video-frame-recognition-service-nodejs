// env
if (!process.env.MONGODB_CONNECTION) {
  console.log("MONGODB_CONNECTION environment variable required.");
  process.exit(1);
}

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_CONNECTION);

var Schema = mongoose.Schema;

var frameSchema = new Schema({
  videoId: String,
  frameIndex: Number,
  uri: String,
  tags: { type: [String], index: true }
});

frameSchema.index({ videoId: 1, frameIndex: 1 });
//frameSchema.set('autoIndex', false);

module.exports = mongoose.model('Frame', frameSchema);
