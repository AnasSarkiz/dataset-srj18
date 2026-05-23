import { existsSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const dataset = require("../index.js")

const samples = readdirSync("samples").filter((file) => file.endsWith(".json")).sort()
if (samples.length !== 5) throw new Error(`Expected 5 samples, found ${samples.length}`)

for (const [index, sampleFile] of samples.entries()) {
  const exportName = `sample${String(index + 1).padStart(3, "0")}`
  if (!dataset[exportName]) throw new Error(`Missing export ${exportName}`)
  const sample = dataset[exportName]
  if (!Array.isArray(sample.obstacles)) throw new Error(`${exportName} missing obstacles`)
  if (!Array.isArray(sample.connections)) throw new Error(`${exportName} missing connections`)
  if (!sample.bounds) throw new Error(`${exportName} missing bounds`)
}

if (!existsSync("index.d.ts")) throw new Error("Missing index.d.ts")

console.log(`Validated ${samples.length} SRJ samples`)
