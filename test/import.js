const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const parse = require('..');

/* global TextDecoderStream */

async function createFromStream(file) {
  const name = path.join(__dirname, file);
  const handle = await fs.open(name);
  return handle.readableWebStream().pipeThrough(new TextDecoderStream());
}

test('should parse kml', async function () {
  const stream = await createFromStream('/fixtures/usa.kml');
  const trip = await parse(stream);
  const expected = require('./fixtures/usa.json');

  assert.deepEqual(trip, expected);
});

test('should parse kml with folders', async function () {
  const stream = await createFromStream('/fixtures/et.kml');
  const trip = await parse(stream);
  const expected = require('./fixtures/et.json');

  assert.deepEqual(trip, expected);
});

test('should parse kml with nested folders', async function () {
  const stream = await createFromStream('/fixtures/nested.kml');
  const trip = await parse(stream);
  const expected = require('./fixtures/nested.json');

  assert.deepEqual(trip, expected);
});

test('should parse kml no container', async function () {
  const stream = await createFromStream('/fixtures/placemark.kml');
  const trip = await parse(stream);
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

  assert.deepEqual(trip, expected);
});

test('empty KML', async function () {
  const stream = await createFromStream('/fixtures/empty.kml');
  const trip = await parse(stream);
  assert.deepEqual(trip, { destination: 'empty' });
});

test('should raise error on invalid XML file', async function () {
  const stream = await createFromStream('/fixtures/invalid.kml');
  await assert.rejects(parse(stream));
});
