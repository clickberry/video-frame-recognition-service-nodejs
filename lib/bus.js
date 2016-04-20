// env
if (!process.env.NSQLOOKUPD_ADDRESSES) {
  console.log("NSQLOOKUPD_ADDRESSES environment variable required.");
  process.exit(1);
}

var events = require('events');
var util = require('util');
var nsq = require('nsqjs');
var debug = require('debug')('clickberry:video-frame-recognition:bus');

function Bus(options) {
  options = options || {};
  options.nsqlookupdAddresses = options.nsqlookupdAddresses || process.env.NSQLOOKUPD_ADDRESSES;

  var bus = this;
  events.EventEmitter.call(this);

  // register readers
  var lookupdHTTPAddresses = options.nsqlookupdAddresses.split(',');
  debug('lookupdHTTPAddresses: ' + JSON.stringify(lookupdHTTPAddresses));

  var frames_reader = new nsq.Reader('video-frame-creates', 'object-recognition', {
    lookupdHTTPAddresses: lookupdHTTPAddresses
  });
  frames_reader.connect();
  frames_reader.on('message', function (msg) {
    // touch the message until timeout
    function touch() {
      if (!msg.hasResponded) {
        debug('Touch [%s]', msg.id);
        msg.touch();
        // Touch the message again a second before the next timeout. 
        setTimeout(touch, msg.timeUntilTimeout() - 1000);
      }
    }
    setTimeout(touch, msg.timeUntilTimeout() - 1000);

    bus.emit('frame', msg);
  });
}

util.inherits(Bus, events.EventEmitter);

module.exports = Bus;
