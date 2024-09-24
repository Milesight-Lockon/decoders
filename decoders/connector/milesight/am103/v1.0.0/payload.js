/**
 * Milesight AM103 Payload Decoder
 *
 */


/* ******************************************
 * bytes to number
 ********************************************/
function readUInt16LE(bytes) {
  var value = (bytes[1] << 8) + bytes[0];
  return value & 0xffff;
}

function readInt16LE(bytes) {
  var ref = readUInt16LE(bytes);
  return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
  var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
  return (value & 0xffffffff) >>> 0;
}

// function readInt32LE(bytes) {
//   var ref = readUInt32LE(bytes);
//   return ref > 0x7fffffff ? ref - 0x100000000 : ref;
// }


function Decoder(bytes) {
    var decoded = {};

  for (var i = 0; i < bytes.length; ) {
      var channel_id = bytes[i++];
      var channel_type = bytes[i++];
      // BATTERY
      if (channel_id === 0x01 && channel_type === 0x75) {
          decoded.battery = bytes[i];
          i += 1;
      }
      // TEMPERATURE
      else if (channel_id === 0x03 && channel_type === 0x67) {
          // ℃
          decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
          i += 2;

          // ℉
          // decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10 * 1.8 + 32;
          // i +=2;
      }
      // HUMIDITY
      else if (channel_id === 0x04 && channel_type === 0x68) {
          decoded.humidity = bytes[i] / 2;
          i += 1;
      }
      // CO2
      else if (channel_id === 0x07 && channel_type === 0x7d) {
          decoded.co2 = readUInt16LE(bytes.slice(i, i + 2));
          i += 2;
      }
      // HISTORY DATA
      else if (channel_id === 0x20 && channel_type === 0xce) {
          var data = {};
          data.timestamp = readUInt32LE(bytes.slice(i, i + 4));
          data.temperature = readInt16LE(bytes.slice(i + 4, i + 6)) / 10;
          data.humidity = bytes[i + 6] / 2;
          data.co2 = readUInt16LE(bytes.slice(i + 7, i + 9));
          i += 9;

          decoded.history = decoded.history || [];
          decoded.history.push(data);
      } else {
          break;
      }
  }

  return decoded;

}

// let payload = [{ variable: "payload", value: "0175640367180104686D077DC501" }];

const data = payload.find((x) => x.variable === "payload_raw" || x.variable === "payload" || x.variable === "data");
if (data) {
  const buffer = Buffer.from(data.value, "hex");
  const serie = new Date().getTime();
  payload = payload.concat(Decoder(buffer)).map((x) => ({ ...x, serie }));
}

// console.log(payload);

