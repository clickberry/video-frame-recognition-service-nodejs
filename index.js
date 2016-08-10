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

  // we will recognize objects in 1 frame per second
  debug('Video frame ready for recognition: ' + JSON.stringify(frame));

  // detecting objects
  var features = [
    {name: 'LABEL_DETECTION', maxResults: 10},
    {name: 'LOGO_DETECTION',  maxResults: 10},
    {name: 'FACE_DETECTION', maxResults: 10},
    {name: 'TEXT_DETECTION', maxResults: 10}
  ];

  function finishProcessing(frame) {
    debug('Video frame Google recognition results (' + frame.uri + '): ' + JSON.stringify(frame));
    msg.finish();
  }

  recognizer.detect(frame.uri, {features: features}, function (err, results) {
    if (err) return handleError(err);

    // checking if the frame has been alreade processed by another analyzer
    var query  = Frame.where({
      videoId: frame.videoId, 
      segmentIndex: frame.segmentIdx, 
      frameIndex: frame.frameIdx
    });

    query.findOne(function (err, frame) {
      if (err) return handleError(err);

      // save recognition results
      if (frame) {
        debug('Appending Google recognition results to the existing frame record.');

        // update frame
        var updateParams = {
          tags: results[0].labels,
          text: results[0].text,
          logos: results[0].logos,
          faces: results[0].faces
        };
        frame.update(updateParams, function (err) {
          if (err) return handleError(err);

          finishProcessing(frame);
        });
      } else {
        // create frame
        Frame.create({
          videoId: frame.videoId,
          videoUri: frame.videoUri,
          segmentIndex: frame.segmentIdx,
          frameIndex: frame.frameIdx,
          uri: frame.uri,
          tags: results[0].labels,
          text: results[0].text,
          logos: results[0].logos,
          faces: results[0].faces
        }, function (err, f) {
          if (err) return handleError(err);

          finishProcessing(f);
        });
      }
    });

  });
});

debug('Listening for messages...');
