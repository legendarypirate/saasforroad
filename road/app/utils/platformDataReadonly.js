/** Shared 403 when tenants try to mutate platform-owned Дата catalog entities. */
const MESSAGE =
  "Энэ датаг платформ (admin.rcos.mn) удирддаг. Түрээслэгч зөвхөн харах / холбогдох боломжтой.";

function rejectPlatformOwned(res, message = MESSAGE) {
  return res.status(403).json({ success: false, message });
}

module.exports = { MESSAGE, rejectPlatformOwned };
