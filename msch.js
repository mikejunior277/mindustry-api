const content = require("./content");
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

    // position tools
  }
  /**
  * Converts a single number to get the actual x and y coordinates of the block
  *
  * @param {Number} value
   */
  unpack(value){
    const overflow = 65535;
    return {
      x: (value % overflow) - Math.floor(value / overflow),
      y: Math.floor(value / overflow),
    };
  }
  /**
  * The reverse of unpack (Converts x and y to a single number)
  * @param {Number} x
  * @param {Number} y
  */
  pack(x, y) {
    const overflow = 65535;
    return y * overflow + x;
  }
  /**
   * Loads a schematic from file path (synchronous)
   * @param {String} fname The file path to load.
   */
  loadFile(fname) {
    const up = (err) => new Error(err); // Helper function for errors
    const path = require("path"); // Path
    const fs = require("fs"); // Access filesystem

    // Is it valid?
    if (!fname) throw up("Needs file to read"); // Of course it needs a file name
    if (!fs.existsSync(fname)) throw up("File does not exist"); // Does the file exist?
    if (path.extname(fname) !== ".msch") throw up("File has wrong extension"); // Is the file .msch?
    let buffer = fs.readFileSync(fname); // Read the file into buffer
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

    var ver = readNext(1, "int");
    // Inflate file
    buffer = buffer.slice(5, buffer.length);
    buffer = zlib.inflateSync(buffer);
    readI = 0;

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
    this.schematic = [];

    for (let i = 0; i < this.total; i++) {
      let next = {};
      next.block = this.blocks[readNext(1, "int")]; //the block
      next.position = this.unpack(readNext(4, "int")); //where the block is
      // next.value = readNext(1, "int"); //what the value is
      /*
        how do i do this
        Object config = ver == 0 ? mapConfig(block, stream.readInt(), position) : TypeIO.readObject(Reads.get(stream));
        */
       next.config =mapConfig(next.block,readNext(4, "int"),next.position)
      next.rotation = readNext(1, "int"); //what the block's rotation is

      this.schematic.push(next);
    }

    function mapConfig(block, value, position) {
      switch (block) {
        case "item-source":
        case "unloader":
        case "sorter":
          return content.items[value];
        case "liquid-source":
          return content.liquids[value];
        case "massDriver":
        case "bridge-conveyor":
          let pos2 = this.unpack(value);
          return { x: pos2.x - position.x, y: pos2.y - position.y };
        //I hope this is right
        //original code:
        // return Point2.unpack(value).sub(
        //   Point2.x(position),
        //   Point2.y(position)
        // );
        case "lightBlock":
          return value;
        default:
          return null;
      }
    }

    function readObject(read) {
      var type = readNext(1, "int");
      switch (type) {
        case 0:
          return null;
        case 1:
          return readNext(4, "int"); // int
        case 2:
          return readNext(4, "int"); // long
        case 3:
          return readNext(4, "int"); // float (need to parse it)
        case 4:
          return readString(read);
        // case 5: return content.getByID(ContentType.all[read.b()], read.s());
        // case 6: short length = read.s(); IntSeq arr = new IntSeq(); for(int i = 0; i < length; i ++) arr.add(read.i()); return arr;
        case 7:
          return this.pack(readNext(4, "int"), readNext(4, "int"));
        // case 8: byte len = read.b(); Point2[] out = new Point2[len]; for(int i = 0; i < len; i ++) out[i] = Point2.unpack(read.i()); return out;
        // case 9: return TechTree.getNotNull(content.getByID(ContentType.all[read.b()], read.s()));
        case 10:
          return !!readNext(1, "int"); //Booleen, I think this is right?
        // case 11: return read.d(); //No idea what this is
        // case 12: return world.build(read.i());
        // case 13: return LAccess.all[read.s()];
        // case 14: int blen = read.i(); byte[] bytes = new byte[blen]; read.b(bytes); return bytes;
        // case 15: return UnitCommand.all[read.b()];
        default:
          throw up("Unknown object type: " + type);
      }
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
