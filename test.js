const axios = require("axios");
const zlib = require("zlib");

const a = async () => {
  const response = await axios.get("https://itch.io/jam/379683/entries.json");
  const data = response.data["jam_games"];

  for (const obj of data) {
    delete obj.id;
    delete obj.game.id;
    delete obj.game.user.id;
    delete obj.game.user.url;
    obj.contributors = obj.contributors ? obj.contributors.length : 0;
  }

  const raw_size = sizeOf(data);
  console.log("Raw size is: ", raw_size / 1024 / 1024, "MB");

  // no need to minify as the JSON is already minimized
  const dataStr = JSON.stringify(data);
  zlib.gzip(dataStr, (err, buffer) => {
    if (!err) {
      console.log("Successfully encoded");
      console.log(`Compressed size: ${buffer.length / 1024 / 1024} MB`);

      // Decompress the buffer
      zlib.unzip(buffer, (err, decompressedBuffer) => {
        if (!err) {
          const jsonData = decompressedBuffer.toString("ascii");
          const decompressedData = JSON.parse(jsonData);
          // console.log("Decompressed Data:", decompressedData);
          console.log(
            `Decompressed data size: ${sizeOf(decompressedData) / 1024 / 1024} MB`
          );
        } else {
          console.error("Error decompressing data:", err);
        }
      });
    } else {
      console.error("Error compressing data:", err);
    }
  });
};

a();
