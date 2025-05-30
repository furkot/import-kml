[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]

# @furkot/import-kml

Import [KML] files into [Furkot] road trip planner.

## Install

```sh
$ npm install --save furkot-import-kml
```

## Usage

Use with a web transform stream: pipe network responses, files etc.

```js
import furkotImportKml from '@furkot/import-kml';

const { body } = await fetch('https://example.com/my.kml');
const from = body.pipeThrough(new TextDecoderStream());
const trip = await furkotImportKml(from);

console.log(trip);
```

## License

MIT © [Damian Krzeminski](https://code42day.com)

[Furkot]: https://furkot.com
[KML]: https://developers.google.com/kml

[npm-image]: https://img.shields.io/npm/v/@furkot/import-kml
[npm-url]: https://npmjs.org/package/@furkot/import-kml

[build-url]: https://github.com/furkot/import-kml/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/actions/workflow/status/furkot/import-kml/check.yaml?branch=main
