var saxStream = require('sax-stream');

module.exports = parseKlm;


var util = {
  toArray: function(a) { return Array.isArray(a) ? a : [a]; },
  copyProp: copyProp
};

function copyProp(dest, propDest, src, propSrc) {
  if (src.children && src.children[propSrc] && src.children[propSrc].value) {
    dest[propDest] = src.children[propSrc].value;
  }
}

function conformStop(s) {
  if (typeof s.pin === 'string') {
    s.pin = parseInt(s.pin, 10);
  }
  return s;
}

var NAMES = {
  icon: 'pin'
};

var STOP_FIELDS = {
  'name': true,
  'icon': true,
  'url': true
};

function parseExtendedData(stop, ed) {
  if (!ed || !ed.children) {
    return;
  }
  util.toArray(ed.children.DATA)
  .filter(function(item) {
    if (!item.attribs) {
      return;
    }
    return STOP_FIELDS[item.attribs.NAME];
  })
  .forEach(function(item) {
    var name = item.attribs.NAME;
    if (name) {
      util.copyProp(stop, NAMES[name] || name, item, 'VALUE');
    }
  });
}

function parsePoint(coords) {
  if (coords) {
    coords = coords.split(',').map(parseFloat);
    if (coords[0] && !isNaN(coords[0]) && coords[1] && !isNaN(coords[1])) {
      return {
        lon: coords[0],
        lat: coords[1]
      };
    }
  }
}

function parseTrackPoint(track, coords) {
  coords = parsePoint(coords);
  if (coords) {
    track.push({
      coordinates: coords
    });
  }
  return track;
}

function parseLineString(result, ls) {
  var track;
  if (ls.children && ls.children.COORDINATES) {
    track = [];
    ls.children.COORDINATES.value.split(/\s+/).reduce(parseTrackPoint, track);
    if (track.length) {
      result.track.push(track);
    }
  }
}

function parsePlacemark(result, pl) {
  var stop;
  if (pl.children) {
    if (pl.children.POINT) {
      stop = {};
      util.copyProp(stop, 'name', pl, 'NAME');
      util.copyProp(stop, 'coordinates', pl.children.POINT, 'COORDINATES');
      stop.coordinates = parsePoint(stop.coordinates);
      util.copyProp(stop, 'notes', pl, 'DESCRIPTION');
      util.copyProp(stop, 'address', pl, 'ADDRESS');
      if (pl.children.TIMESTAMP) {
        util.copyProp(stop, 'timestamp', pl.children.TIMESTAMP, 'WHEN');
      }
      parseExtendedData(stop, pl.children.EXTENDEDDATA);
      result.stops.push(conformStop(stop));
    }
    else if (pl.children.LINESTRING) {
      parseLineString(result, pl.children.LINESTRING);
    }
  }
  return result;
}

function parseContainer(trip, kml, root) {
  if (kml.children) {
    if (!root) {
      if (!trip.destination) {
        util.copyProp(trip, 'destination', kml, 'NAME');
      }
      if (!trip.notes) {
        util.copyProp(trip, 'notes', kml, 'DESCRIPTION');
      }
    }
    if (kml.children.PLACEMARK) {
      util.toArray(kml.children.PLACEMARK).reduce(parsePlacemark, trip);
    }
    if (kml.children.FOLDER) {
      util.toArray(kml.children.FOLDER).reduce(parseContainer, trip);
    }
    if (kml.children.DOCUMENT) {
      util.toArray(kml.children.DOCUMENT).reduce(parseContainer, trip);
    }
  }
  return trip;
}

function parseKlm(file, fn) {
  var trip;

  file
    .pipe(saxStream({
      tag: 'KML'
    }))
    .on('data', function(kml) {
      if (!kml) {
        return fn('invalid');
      }
      trip = parseContainer({
        stops: [],
        track: []
      }, kml, true);
      if (!trip.stops.length) {
        delete trip.stops;
      }
      if (!trip.track.length) {
        delete trip.track;
      }
      if (!(trip.stops || trip.track)) {
        return fn('no stops');
      }
      process.nextTick(function() {
        fn(null, trip);
      });
    })
    .on('end', function () {
      if (!trip) {
        return fn('invalid');
      }
    })
    .on('error', fn);
}
