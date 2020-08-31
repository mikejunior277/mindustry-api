/**
 * A Mindustry Schematic
 */
class Schematic {
  /**
   * Load or create a schematic
   * @param {Buffer} buffer The buffer to load. If left blank, a new schematic is created
   */
  constructor(buffer) {
    if (buffer) this.load(buffer);
  }

  /**
   * Loads a schematic from file path
   * @param {String} fname The file path to load.
   */
  loadFile(fname) {
    const up = (err) => new Error(err); // Helper function for errors
    const path = require("path"); // Path
    const fs = require("fs"); // Access filesystem

    // Is it valid?
    if (!fname) throw up("Needs file to read"); // Of course it needs a file name
    if (!fs.existsSync(file)) throw up("File does not exist"); // Does the file exist?
    if (path.extname(file) !== ".msch") throw up("File has wrong extension"); // Is the file .msch?
    buffer = fs.readFileSync(file); // Read the file into buffer
    this.load(buffer);
  }

  /**
   * Loads a schematic from buffer
   * @param {Buffer} buffer The buffer to load.
   */
  load(buffer) {
    const up = (err) => new Error(err); // Helper function for errors
    const zlib = require("zlib"); // For decompressing
    let readI = 0; // See the readnext function at the bottom

    // Is it valid?
    if (readNext(4, "str") !== "msch") {
      throw up("Not a msch file"); //Is the header `msch`
    }

    // Inflate file
    buffer = buffer.slice(5, buffer.length);
    buffer = zlib.inflateSync(buffer);
    readI = 0;

    fs.writeFileSync("asd.txt", buffer);

    // height and width
    this.width = readNext(2, "int");
    this.height = readNext(2, "int");

    // tags
    let tags = readNext(1, "int");
    this.tags = {};
    for (let i = 0; i < tags; i++) {
      let key = readNext(readNext(2, "int"), "str");
      let value = readNext(readNext(2, "int"), "str");
      this.tags[key] = value;
    }

    // block dictionary
    this.blocks = [];
    let blocks = readNext(1, "int");
    for (let i = 0; i < blocks; i++) {
      let block = readNext(readNext(2, "int"), "str");
      this.blocks.push(block);
    }

    // total blocks
    this.total = readNext(4, "int");

    // read schematic
    const overflow = 65535;

    this.schematic = [];
    for (let i = 0; i < this.total; i++) {
      let next = {};
      next.block = this.blocks[readNext(1, "int")]; //the block
      next.position = readNext(4, "int"); //where the block is
      next.value = readNext(1, "int"); //what the value is
      next.rotation = readNext(1, "int"); //what the block's rotation is

      //get the actual x and y coordinates of the block
      next.position = {
        x: (next.position % overflow) - Math.floor(next.position / overflow),
        y: Math.floor(next.position / overflow),
      };

      this.schematic.push(next);
    }

    // Helps read bytes
    function readNext(bytes, as) {
      let from = readI;
      readI += bytes;
      switch ((as || "").toLowerCase()) {
        case "str":
          // Read as string
          return buffer.slice(from, readI).toString("utf-8");
        case "hex":
          // Read as hex
          return buffer.slice(from, readI).toString("hex");
        case "int":
          // Read as int
          return parseInt(buffer.slice(from, readI).toString("hex"), 16);
        default:
          // Read as buffer
          return buffer.slice(from, readI);
      }
      // We don't need breaks because we have returns
    }

    return this;
  }

  /**
   * Sets the width of the schematic
   * @param {Integer} width The new width of the schematic.
   */
  setWidth(width) {
    this.width = width;
    return this;
  }

  /**
   * Sets the height of the schematic
   * @param {Integer} height The new height of the schematic.
   * }
   */
  setHeight(height) {
    this.height = height;
    return this;
  }

  /**
   * Gets the width of the schematic
   * @returns {Integer} The width of the schematic
   */
  getWidth() {
    return this.width;
  }

  /**
   * Gets the height of the schematic
   * @returns {Integer} The height of the schematic
   */
  getHeight() {
    return this.height;
  }

  /**
   * Combine both setWidth and setHeight into a single function
   * @param {Integer} width The new width of the schematic.
   * @param {Integer} height The new height of the schematic.
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    return this;
  }
}

module.exports = Schematic;
