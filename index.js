// env
if (!process.env.VISION_API_TOKEN) {
  console.log("VISION_API_TOKEN environment variable required.");
  process.exit(1);
}

var debug = require('debug')('clickberry:video-frame-recognition:worker');
var Recognizer = require('./lib/recognizer');
var recognizer = new Recognizer(process.env.VISION_API_TOKEN);

var url = 'https://clickberryframesqa.s3.amazonaws.com/70e57055-7a1c-4d72-b787-bab84e8abb69/tmp-48291eKY28qzAwqt3_45.jpg';

recognizer.detect(url, function (err, results) {
  if (err) return console.error(err);
  console.log(results);
});
