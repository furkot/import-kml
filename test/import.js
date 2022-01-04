const test = require('tape');
const fs = require('fs');
const parse = require('..');

test('should parse kml', function (t) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/usa.kml`);
  parse(stream, (err, trip) => {
    const expected = require('./fixtures/usa.json');

    t.error(err);
    t.deepEqual(trip, expected);
    t.end();
  });
});

test('should parse kml with folders', function(t) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/et.kml`);
  parse(stream, (err, trip) => {
    const expected = require('./fixtures/et.json');

    t.error(err);
    t.deepEqual(trip, expected);
    t.end();
  });
});

test('should parse kml with nested folders', function(t) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/nested.kml`);
  parse(stream, (err, trip) => {
    const expected = require('./fixtures/nested.json');

    t.error(err);
    t.deepEqual(trip, expected);
    t.end();
  });
});

test('should parse kml no container', function(t) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/placemark.kml`);
  parse(stream, (err, trip) => {
    const expected = {
      stops: [{
        coordinates: {
          lat: 37.422069,
          lon: -122.087461
        },
        name: 'My office',
        notes: 'This is the location of my office.'
      }]
    };

    t.error(err);
    t.deepEqual(trip, expected);
    t.end();
  });
});

test('empty KML', function(t) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/empty.kml`);
  parse(stream, (err, trip) => {
    t.error(err);
    t.deepEqual(trip, { destination: 'empty' });
    t.end();
  });
});

test('should raise error on invalid XML file', function(t) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/invalid.kml`);
  parse(stream, (err, trip) => {
    t.notLooseEqual(err, null, 'error should exists');
    t.equal(err.err, 'invalid');
    t.ok('message' in err, 'should have property message');
    t.looseEqual(trip, null, 'trips should not exist');
    t.end();
  });
});
