/**
 * @fileOverview Encapsulates image recognition logic.
 */

var debug = require('debug')('clickberry:video-frame-recognition:recognizer');

/** 
 * Available features: FACE_DETECTION, LANDMARK_DETECTION, LOGO_DETECTION, LABEL_DETECTION,
 * TEXT_DETECTION.
 * @constant 
 */
var DEFAULT_FEATURES = [
  {name: 'LABEL_DETECTION', maxResults: 10},
  {name: 'LOGO_DETECTION',  maxResults: 10},
  {name: 'FACE_DETECTION', maxResults: 10},
  {name: 'TEXT_DETECTION', maxResults: 10}
];

 /**
 * A class for detecting objects on image.
 *
 * @class
 */
var Recognizer = function (api_token) {
  // init google vision api
  this.vision = require('node-cloud-vision-api');
  this.vision.init({auth: api_token});
};

/**
 * Maps labelAnnotation response to internal format.
 *
 * @method     mapLabelAnnotations
 * @param      {Object}  res     Google vision API response.
 * @return     {Array}   plain array of detected objects.
 */
function mapLabelAnnotations(res) {
  if (!res || !res.labelAnnotations) {
    return [];
  }

  return res.labelAnnotations.map(function (o) {
    return o.description;
  });
}

/**
 * Maps textAnnotation response to internal format.
 *
 * @method     mapTextAnnotations
 * @param      {Object}  res     Google vision API response.
 * @return     {Array}   Array of recognized text and its coordinates.
 */
function mapTextAnnotations(res) {
  if (!res || !res.textAnnotations) {
    return [];
  }

  var i, result = [];
  for (i = 0; i < res.textAnnotations.length; i++) {
    var desc = res.textAnnotations[i];
    if (desc.locale) continue; // skipping summary
    
    result.push({
      text: desc.description,
      vertices: desc.boundingPoly.vertices
    });
  }

  return result;
}

/**
 * Maps faceAnnotation response to internal format.
 *
 * @method     mapFaceAnnotations
 * @param      {Object}  res     Google vision API response.
 * @return     {Array}   Array of recognized faces and its coordinates.
 */
function mapFaceAnnotations(res) {
  if (!res || !res.faceAnnotations) {
    return [];
  }

  var i, result = [];
  for (i = 0; i < res.faceAnnotations.length; i++) {
    var face = res.faceAnnotations[i];    
    result.push({
      vertices: face.boundingPoly.vertices
    });
  }

  return result;
}

/**
 * Detects objects on images specified by uris.
 *
 * @method     detect
 * @param      {string|array}  image_uris  Image URI, comma separated URIs or array of URIs.
 * @param      {Object}        opts        Addition options.
 * @param      {Function}      fn          Callback.
 */
Recognizer.prototype.detect = function (image_uris, opts, fn) {
  var recognizer = this;
  // normalize parameters
  if (image_uris.constructor !== Array) {
    image_uris = image_uris.split(',');  
  }
  if (!image_uris.length) {
    return fn(new Error('image_uris required'));
  }

  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  opts = opts || {};
  if (!opts.features) {
    opts.features = DEFAULT_FEATURES;
  }

  // build requests
  var requests = [];
  var features = [];
  opts.features.forEach(function (f) {
    features.push(new recognizer.vision.Feature(f.name, f.maxResults));
  });

  image_uris.forEach(function (uri) {
    var req = new recognizer.vision.Request({
      image: new recognizer.vision.Image({
        url: uri
      }),
      features: features
    });
    requests.push(req);
  });

  debug('Detecting objects on images: ' + image_uris.join(','));

  // make api call
  recognizer.vision.annotate(requests).then(function (res) {
    debug('Detected objects on images ' + image_uris.join(',') + ': ' + JSON.stringify(res.responses));

    // formatting results
    var results = res.responses.map(function (res, i) {
      return {
        image: image_uris[i],
        labels: mapLabelAnnotations(res),
        text: mapTextAnnotations(res),
        faces: mapFaceAnnotations(res)
      };
    });

    fn(null, results);
  }, function (err) {
    debug('Error detecting objects on images ' + image_uris.join(',') + ': ' + err);
    fn(err);
  });
};

module.exports = Recognizer;
