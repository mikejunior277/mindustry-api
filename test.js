const { Schematic } = require("./index.js")
let schem = new Schematic
schem.loadFile("test.msch")
require("fs").writeFileSync("sample.json", JSON.stringify(schem))
// console.log(JSON.stringify(schem));