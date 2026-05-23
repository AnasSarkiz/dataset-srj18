"use strict"

exports.sample001 = require("./samples/sample001.json")
exports.sample002 = require("./samples/sample002.json")
exports.sample003 = require("./samples/sample003.json")
exports.sample004 = require("./samples/sample004.json")
exports.sample005 = require("./samples/sample005.json")

exports.dataset = {
  sample001: exports.sample001,
  sample002: exports.sample002,
  sample003: exports.sample003,
  sample004: exports.sample004,
  sample005: exports.sample005,
}

exports.default = exports.dataset
