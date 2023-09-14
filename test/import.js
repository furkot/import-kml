const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const parse = require('..');

test('should parse kml', function (t, done) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/usa.kml`);
  parse(stream, (err, trip) => {
    const expected = require('./fixtures/usa.json');

    assert.ifError(err);
    assert.deepEqual(trip, expected);
    done();
  });
});

test('should parse kml with folders', function (t, done) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/et.kml`);
  parse(stream, (err, trip) => {
    const expected = require('./fixtures/et.json');

    assert.ifError(err);
    assert.deepEqual(trip, expected);
    done();
  });
});

test('should parse kml with nested folders', function (t, done) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/nested.kml`);
  parse(stream, (err, trip) => {
    const expected = require('./fixtures/nested.json');

    assert.ifError(err);
    assert.deepEqual(trip, expected);
    done();
  });
});

test('should parse kml no container', function (t, done) {
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

    assert.ifError(err);
    assert.deepEqual(trip, expected);
    done();
  });
});

test('empty KML', function (t, done) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/empty.kml`);
  parse(stream, (err, trip) => {
    assert.ifError(err);
    assert.deepEqual(trip, { destination: 'empty' });
    done();
  });
});

test('should raise error on invalid XML file', function (t, done) {
  const stream = fs.createReadStream(`${__dirname}/fixtures/invalid.kml`);
  parse(stream, (err, trip) => {
    assert.ok(err != null, 'error should exists');
    assert.equal(err.err, 'invalid');
    assert.ok('message' in err, 'should have property message');
    assert.ok(trip == null, 'trips should not exist');
    done();
  });
});
