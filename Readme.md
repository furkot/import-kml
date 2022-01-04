[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]

# furkot-import-kml

Import [KML] files into [Furkot] road trip planner.

## Install

```sh
$ npm install --save furkot-import-kml
```

## Usage

Use as a transform stream: pipe network responses, files etc. and listen on `data` event.

```js
var furkotImportKml = require('furkot-import-kml');
var request = require('getlet');

request('https://example.com/my.kml')
  .pipe(furkotImportKml)
  .on('data', function(trip) {
    console.log(trip);
  });
```

## License

MIT © [Damian Krzeminski](https://code42day.com)

[Furkot]: https://furkot.com
[KML]: https://developers.google.com/kml

[npm-image]: https://img.shields.io/npm/v/furkot-import-kml.svg
[npm-url]: https://npmjs.org/package/furkot-import-kml

[build-url]: https://github.com/furkot/import-kml/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/workflow/status/furkot/import-kml/check
