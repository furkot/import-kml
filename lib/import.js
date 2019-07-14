var sss = require('sax-super-stream');

module.exports = parseKlm;


// coordinates are represented as triple - lon,lat,alt
function str2coordinates(str) {
  var coords = str
    .split(',')
    .slice(0, 2) // chop altitude
    .map(parseFloat)
    .filter(function(c) {
      return !Number.isNaN(c);
    });
  if (coords.length === 2) {
    return {
      lon: coords[0],
      lat: coords[1]
    };
  }
}

function parseCoordinates(coords, stop) {
  coords = str2coordinates(coords);
  if (coords) {
    stop.coordinates = coords;
  }
}

function parseLineString(value, stop) {
  var track = [];

  value
    .split(/\s+/)
    .map(str2coordinates)
    .filter(function(c) { return c; })
    .forEach(function(c) {
      track.push({
        coordinates: c
      });
    });

  if (track.length) {
    stop.track = track;
  }
}

function parseExtendedData(node, parent, context) {
  context.propertyName = node.attributes.name.value;
}

var PROPERTIES = {
  'duration': { type: 'int' },
  'icon': { name: 'pin', type: 'int' },
  'url': true
};

function parseExtendedDataValue(value, parent, context) {
  var propertyName = context.propertyName,
    propertyInfo = PROPERTIES[propertyName];

  delete context.dataName;
  if (!propertyInfo) {
    return;
  }
  if (propertyInfo.type === 'int') {
    value = parseInt(value, 10);
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
  var parent = this.top(1);

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
  return function (text, obj) {
    obj[property] = obj[property] || text;
  };
}

var LINESTRING_PARSER = {
  'coordinates': { $text: parseLineString }
};

var PLACEMARK_PARSER = {
  $: sss.object(),
  $after: appendPlacemark,
  'name': { $text: sss.assignTo('name') },
  'description': { $text: sss.assignTo('notes') },
  'address': { $text: sss.assignTo('address') },
  'Timestamp': {
    'when': { $text: sss.assignTo('timestamp') }
  },
  'Point': {
    'coordinates': { $text: parseCoordinates }
  },
  'LineString': LINESTRING_PARSER,
  'MultiGeometry': {
    'LineString': LINESTRING_PARSER
  },
  'ExtendedData': {
    'Data': {
      $: parseExtendedData,
      'value': { $text: parseExtendedDataValue }
    }
  }
};

var FEATURE_PARSER = {
  'Placemark': PLACEMARK_PARSER
};

var FOLDER_PARSER = {
  'name': { $text: assignToFirst('destination') },
  'description': { $text: assignToFirst('notes') }
};
Object.assign(
  FOLDER_PARSER,
  FEATURE_PARSER
);
FOLDER_PARSER['Folder'] = FOLDER_PARSER;

var DOCUMENT_PARSER = {};
Object.assign(
  DOCUMENT_PARSER,
  FEATURE_PARSER,
  FOLDER_PARSER
);
FOLDER_PARSER['Document'] = DOCUMENT_PARSER;

var PARSER_CONFIG = {
  'kml': {
    $: sss.object(),
    'Placemark': PLACEMARK_PARSER,
    'Document': DOCUMENT_PARSER,
    'Folder': FOLDER_PARSER
  }
};

function parseKlm(file, fn) {
  var done;

  file
    .pipe(sss(PARSER_CONFIG))
    .on('data', function(trip) {
      done = true;
      fn(null, trip);
    })
    .on('end', function () {
      if (!done) {
        return fn('invalid');
      }
    })
    .on('error', function(err) {
      fn({
       err: 'invalid',
       message: err.message
     });
    });
}
