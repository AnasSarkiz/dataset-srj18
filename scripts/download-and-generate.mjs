import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "@tscircuit/core"

const owner = "sabogalc"
const repo = "KiCad-Arduino-Boards"
const ref = "main"

const boards = [
  { id: "arduino-leonardo", name: "Arduino Leonardo", path: "KiCad Projects/Arduino Leonardo" },
  { id: "arduino-mega-2560", name: "Arduino Mega 2560", path: "KiCad Projects/Arduino Mega 2560" },
  { id: "arduino-micro", name: "Arduino Micro", path: "KiCad Projects/Arduino Micro" },
  { id: "arduino-nano", name: "Arduino Nano", path: "KiCad Projects/Arduino Nano" },
  { id: "arduino-uno", name: "Arduino Uno", path: "KiCad Projects/Uno/Arduino Uno" },
]

const samplesDir = "samples"
const pcbDir = "kicad_pcb"
const circuitJsonDir = "circuit-json"

const githubContentsUrl = (path) =>
  `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${ref}`

const roundJson = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 1_000_000) / 1_000_000
  }
  if (Array.isArray(value)) return value.map(roundJson)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, roundJson(nested)]))
  }
  return value
}

const fetchJson = async (url) => {
  const response = await fetch(url, { headers: { "user-agent": "dataset-srj18-generator" } })
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  return response.json()
}

const fetchText = async (url) => {
  const response = await fetch(url, { headers: { "user-agent": "dataset-srj18-generator" } })
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  return response.text()
}

rmSync(samplesDir, { recursive: true, force: true })
rmSync(pcbDir, { recursive: true, force: true })
rmSync(circuitJsonDir, { recursive: true, force: true })
mkdirSync(samplesDir, { recursive: true })
mkdirSync(pcbDir, { recursive: true })
mkdirSync(circuitJsonDir, { recursive: true })

const sourceFiles = []

for (const [index, board] of boards.entries()) {
  const sampleName = `sample${String(index + 1).padStart(3, "0")}`
  const entries = await fetchJson(githubContentsUrl(board.path))
  const pcbEntry = entries.find((entry) => entry.type === "file" && entry.name.endsWith(".kicad_pcb"))
  if (!pcbEntry) throw new Error(`No .kicad_pcb file found in ${board.path}`)

  const pcbText = await fetchText(pcbEntry.download_url)
  const pcbFileName = `${sampleName}-${board.id}.kicad_pcb`
  writeFileSync(join(pcbDir, pcbFileName), pcbText)

  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(pcbEntry.name, pcbText)
  converter.runUntilFinished()

  const circuitJson = roundJson(converter.getOutput())
  writeFileSync(join(circuitJsonDir, `${sampleName}-${board.id}.json`), `${JSON.stringify(circuitJson, null, 2)}\n`)

  const simpleRouteResult = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const simpleRouteJson = roundJson(simpleRouteResult.simpleRouteJson ?? simpleRouteResult)
  simpleRouteJson.id = sampleName
  simpleRouteJson.sourceCircuitJson = `circuit-json/${sampleName}-${board.id}.json`
  simpleRouteJson.sourceKicadPcb = `kicad_pcb/${pcbFileName}`
  simpleRouteJson.sourceName = board.name
  simpleRouteJson.sourceUrl = pcbEntry.html_url

  writeFileSync(join(samplesDir, `${sampleName}.json`), `${JSON.stringify(simpleRouteJson, null, 2)}\n`)

  sourceFiles.push({
    sample: sampleName,
    board: board.name,
    kicadPcb: pcbEntry.path,
    sourceUrl: pcbEntry.html_url,
    rawUrl: pcbEntry.download_url,
    warnings: converter.getWarnings(),
    stats: converter.getStats(),
  })

  console.log(`${sampleName}: ${board.name}`)
}

writeFileSync("source-files.json", `${JSON.stringify(sourceFiles, null, 2)}\n`)
