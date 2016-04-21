// env
if (!process.env.VISION_API_TOKEN) {
  console.log("VISION_API_TOKEN environment variable required.");
  process.exit(1);
}

var debug = require('debug')('clickberry:video-frame-recognition:worker');

var Recognizer = require('./lib/recognizer');
var recognizer = new Recognizer(process.env.VISION_API_TOKEN);

var Bus = require('./lib/bus');
var bus = new Bus();

var Frame = require('./lib/frame');

function handleError(err) {
  console.error(err);
}

bus.on('frame', function (msg) {
  var frame = JSON.parse(msg.body);

  if (frame.frame_idx % 25 !== 0) {
    debug('Skipping frame: ' + JSON.stringify(frame));
    return msg.finish();
  }
  
  // we will recognize objects in 1 frame per second
  debug('Video frame ready for recognition: ' + JSON.stringify(frame));

  // detecting objects
  var features = [{name: 'LABEL_DETECTION', maxResults: 10}];
  recognizer.detect(frame.uri, {features: features}, function (err, results) {
    if (err) return handleError(err);

    // save recognition results
    Frame.create({
      videoId: frame.video_id,
      frameIndex: frame.frame_idx,
      uri: frame.uri,
      tags: results[0].labels
    }, function (err, f) {
      if (err) return handleError(err);
      debug('Video frame recognition results (' + frame.uri + '): ' + JSON.stringify(f));

      msg.finish();
    });
  });
});

debug('Listening for messages...');
