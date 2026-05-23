# dataset-srj18

Simple Route JSON dataset generated from five KiCad Arduino boards:

- Arduino Leonardo
- Arduino Mega 2560
- Arduino Micro
- Arduino Nano
- Arduino Uno

Source KiCad PCB files are downloaded from
<https://github.com/sabogalc/KiCad-Arduino-Boards/tree/main/KiCad%20Projects>.

## Usage

```js
const { sample001, dataset } = require("dataset-srj18")
```

## Regenerate

```sh
bun install
bun run generate
bun run test
```

The generator downloads `.kicad_pcb` files into `kicad_pcb/`, converts them to
Circuit JSON with `kicad-to-circuit-json`, and converts that output to Simple
Route JSON with `getSimpleRouteJsonFromCircuitJson` from `@tscircuit/core`.
