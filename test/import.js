var should = require('should');
var fs = require('fs');
var parse = require('..');

describe('furkot import kml', function() {
  it('should parse kml', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/usa.kml');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa.json');

      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('should parse kml with folders', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/et.kml');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/et.json');

      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('should parse kml no container', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/placemark.kml');
    parse(stream, function(err, trip) {
      var expected = {
        stops: [{
          coordinates: {
            lat: 37.422069,
            lon: -122.087461
          },
          name: 'My office',
          notes: 'This is the location of my office.'
        }]
      };

      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('should raise error on invalid XML file', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/invalid.kml');
    parse(stream, function(err, trip) {
      should.exist(err);
      should.not.exist(trip);
      done();
    });
  });
});
