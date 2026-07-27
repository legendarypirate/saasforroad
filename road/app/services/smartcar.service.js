const axios = require("axios");

const SMARTCAR_XYP_URL =
  process.env.SMARTCAR_XYP_URL ||
  "https://xyp-api.smartcar.mn/xyp-api/v1/xyp/get-data-public";

const SMARTCAR_APP_VERSION = process.env.SMARTCAR_APP_VERSION || "1.0.0";

const GET_VEHICLE_INFO = "WS100401_getVehicleInfo";
const GET_VEHICLE_INSPECTION_INFO = "WS100409_getVehicleInspectionInfo";

function normalizePlate(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

async function callXyp(serviceCode, customFields) {
  const { data, status } = await axios.post(
    SMARTCAR_XYP_URL,
    { serviceCode, customFields },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        version: SMARTCAR_APP_VERSION,
      },
      timeout: 20000,
      validateStatus: () => true,
    }
  );

  if (status >= 200 && status < 300 && data && typeof data === "object") {
    return data;
  }

  const message =
    (typeof data === "string" && data.trim()) ||
    data?.message ||
    data?.error ||
    `SmartCar request failed (${status})`;

  const err = new Error(message);
  err.status = status >= 400 ? status : 502;
  err.upstream = data;
  throw err;
}

/**
 * Fetch vehicle registration info from SmartCar XYP by plate number.
 * @param {string} plateNumber
 * @returns {Promise<object>}
 */
async function getVehicleInfo(plateNumber) {
  const plate = normalizePlate(plateNumber);
  if (!plate) {
    const err = new Error("plateNumber is required");
    err.status = 400;
    throw err;
  }
  return callXyp(GET_VEHICLE_INFO, { plateNumber: plate });
}

/**
 * Fetch vehicle technical inspection info from SmartCar XYP by cabin (VIN) number.
 * @param {string} cabinNumber
 * @returns {Promise<object>}
 */
async function getVehicleInspectionInfo(cabinNumber) {
  const cabin = String(cabinNumber || "").trim().toUpperCase();
  if (!cabin) {
    const err = new Error("cabinNumber is required");
    err.status = 400;
    throw err;
  }
  return callXyp(GET_VEHICLE_INSPECTION_INFO, { cabinNumber: cabin });
}

module.exports = {
  getVehicleInfo,
  getVehicleInspectionInfo,
  normalizePlate,
};
