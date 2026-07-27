const {
  getVehicleInfo,
  getVehicleInspectionInfo,
} = require("../services/smartcar.service");

/**
 * POST /api/smartcar/vehicle-info
 * Body: { plateNumber | plate_number | plate }
 */
exports.getVehicleInfo = async (req, res) => {
  try {
    const plateNumber =
      req.body?.plateNumber ||
      req.body?.plate_number ||
      req.body?.plate ||
      req.query?.plateNumber ||
      req.query?.plate;

    const data = await getVehicleInfo(plateNumber);
    return res.json({
      ok: true,
      plateNumber: data.plateNumber || plateNumber,
      data,
    });
  } catch (err) {
    const status = err.status || 500;
    console.error("smartcar.getVehicleInfo:", err.message);
    return res.status(status).json({
      ok: false,
      message: err.message || "SmartCar lookup failed",
    });
  }
};

/**
 * POST /api/smartcar/inspection-info
 * Body: { cabinNumber | cabin_number | cabin }
 */
exports.getVehicleInspectionInfo = async (req, res) => {
  try {
    const cabinNumber =
      req.body?.cabinNumber ||
      req.body?.cabin_number ||
      req.body?.cabin ||
      req.query?.cabinNumber ||
      req.query?.cabin;

    const data = await getVehicleInspectionInfo(cabinNumber);
    return res.json({
      ok: true,
      cabinNumber: data.cabinNumber || cabinNumber,
      data,
    });
  } catch (err) {
    const status = err.status || 500;
    console.error("smartcar.getVehicleInspectionInfo:", err.message);
    return res.status(status).json({
      ok: false,
      message: err.message || "SmartCar inspection lookup failed",
    });
  }
};
