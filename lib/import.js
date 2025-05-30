const sss = require('sax-super-stream');

module.exports = parseKlm;

// coordinates are represented as triple - lon,lat,alt
function str2coordinates(str) {
  const [lon, lat] = str
    .split(',')
    .slice(0, 2) // chop altitude
    .map(Number.parseFloat)
    .filter(c => !Number.isNaN(c));
  if (lat != null) {
    return { lon, lat };
  }
}

function parseCoordinates(coords, stop) {
  coords = str2coordinates(coords);
  if (coords) {
    stop.coordinates = coords;
  }
}

function parseLineString(value, stop) {
  const track = [];

  value
    .split(/\s+/)
    .map(str2coordinates)
    .filter(Boolean)
    .forEach(coordinates => track.push({ coordinates }));

  if (track.length) {
    stop.track = track;
  }
}

function parseExtendedData({ attributes }, _parent, context) {
  context.propertyName = attributes.name.value;
}

const PROPERTIES = {
  duration: { type: 'int' },
  icon: { name: 'pin', type: 'int' },
  url: true
};

function parseExtendedDataValue(value, parent, context) {
  let { propertyName } = context;
  const propertyInfo = PROPERTIES[propertyName];

  delete context.dataName;
  if (!propertyInfo) {
    return;
  }
  if (propertyInfo.type === 'int') {
    value = Number.parseInt(value, 10);
    if (Number.isNaN(value)) {
      return;
    }
  }
  if (propertyInfo.name) {
    propertyName = propertyInfo.name;
  }
  parent[propertyName] = value;
}

function appendPlacemark(stop) {
  const parent = this.top(1);

  if (stop.track) {
    parent.track = parent.track || [];
    if (stop.name) {
      stop.track[0].parent = stop.track[0].parent || {};
      stop.track[0].parent.name = stop.name;
    }
    if (stop.notes) {
      stop.track[0].parent = stop.track[0].parent || {};
      stop.track[0].parent.notes = stop.notes;
    }
    if (stop.track[0].parent && stop.track[0].parent.index === undefined) {
      stop.track[0].parent.index = parent.track.length;
    }
    parent.track.push(stop.track);
  } else {
    parent.stops = parent.stops || [];
    parent.stops.push(stop);
  }
}

function assignToFirst(property) {
  return (text, obj) => (obj[property] = obj[property] ?? text);
}

const LINESTRING_PARSER = {
  coordinates: { $text: parseLineString }
};

const PLACEMARK_PARSER = {
  $: sss.object(),
  $after: appendPlacemark,
  name: { $text: sss.assignTo('name') },
  description: { $text: sss.assignTo('notes') },
  address: { $text: sss.assignTo('address') },
  Timestamp: {
    when: { $text: sss.assignTo('timestamp') }
  },
  Point: {
    coordinates: { $text: parseCoordinates }
  },
  LineString: LINESTRING_PARSER,
  MultiGeometry: {
    LineString: LINESTRING_PARSER
  },
  ExtendedData: {
    Data: {
      $: parseExtendedData,
      value: { $text: parseExtendedDataValue }
    }
  }
};

const FEATURE_PARSER = {
  Placemark: PLACEMARK_PARSER
};

const FOLDER_PARSER = {
  name: { $text: assignToFirst('destination') },
  description: { $text: assignToFirst('notes') },
  ...FEATURE_PARSER
};
FOLDER_PARSER['Folder'] = FOLDER_PARSER;

const DOCUMENT_PARSER = {
  ...FEATURE_PARSER,
  ...FOLDER_PARSER
};
FOLDER_PARSER['Document'] = DOCUMENT_PARSER;

const PARSER_CONFIG = {
  kml: {
    $: sss.object(),
    Placemark: PLACEMARK_PARSER,
    Document: DOCUMENT_PARSER,
    Folder: FOLDER_PARSER
  }
};

/* global WritableStream */

async function parseKlm(file) {
  const stream = sss(PARSER_CONFIG);
  let trip;

  await file.pipeThrough(stream).pipeTo(
    new WritableStream({
      write: chunk => (trip = chunk)
    })
  );

  return trip;
}
