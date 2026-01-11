import zlib from "zlib";
import util from "util";

import { roundValue } from "./utils";

// Convert zlib functions to promises
const gzipPromise = util.promisify(zlib.gzip);
const unzipPromise = util.promisify(zlib.unzip);

const sizeOfBuffer = (buf: Buffer) => buf.byteLength;


// EXPECTS ASCII DATA
export const compressJson = async (entry: Object) => {
  // console.log(`Uncompressed as bytelength: ${roundValue(Buffer.byteLength(JSON.stringify(entry))/1024/1024,2)} MB`)
  // console.log(`Uncompressed size: ${roundValue(sizeOfObject(entry)/1024/1024,2)} MB`)

  const dataStr = JSON.stringify(entry);
  try {
    const buffer = await gzipPromise(dataStr);
    console.log(
      `Compressed size with bytelength: ${roundValue(
        sizeOfBuffer(buffer) / 1024 / 1024,
        2
      )} MB`
    );
    // console.log(`Compressed size with sizeofobj func: ${roundValue(sizeOfObject(buffer) / 1024 / 1024,2)} MB`)
    return buffer;
  } catch {
    console.error("ERROR! Couldn't compress entry. Returning null.");
    return null;
  }
};

// EXPECTS ASCII DATA
export const decompressJson = async (buffer: Buffer) => {
  console.log(`Compressed size: ${roundValue(sizeOfBuffer(buffer) / 1024 / 1024, 2)} MB`);

  try {
    const decompressedBuffer = await unzipPromise(buffer);
    const jsonData = decompressedBuffer.toString("utf-8");
    const decompressedData: Object = JSON.parse(jsonData);
    //console.log(
    //  `Decompressed data size: ${roundValue(sizeOfObject(decompressedData) / 1024 / 1024,2)} MB`
    //);
    return decompressedData;
  } catch (e) {
    console.error("Error decompressing data:", e);
    return null;
  }
};
