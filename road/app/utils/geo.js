function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function findNearestOffice(lat, lng, offices) {
  let nearest = null;
  let minDist = Infinity;

  for (const office of offices) {
    const dist = haversineMeters(
      lat,
      lng,
      Number(office.latitude),
      Number(office.longitude)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = office;
    }
  }

  return {
    office: nearest,
    distanceMeters: nearest ? Math.round(minDist) : null,
  };
}

function validateGeofence(lat, lng, offices) {
  if (!offices.length) {
    return {
      ok: false,
      message: "Оффисын байршил тохируулаагүй байна. Админтай холбогдоно уу.",
    };
  }

  const { office, distanceMeters } = findNearestOffice(lat, lng, offices);
  if (!office) {
    return { ok: false, message: "Ойролцоо оффис олдсонгүй" };
  }

  const radius = Number(office.radius_meters) || 100;
  if (distanceMeters > radius) {
    return {
      ok: false,
      message: `«${office.name}» оффисоос ${distanceMeters}м зайтай байна. ${radius}м-ийн дотор байх шаардлагатай.`,
      office,
      distanceMeters,
      radius,
    };
  }

  return { ok: true, office, distanceMeters, radius };
}

module.exports = { haversineMeters, findNearestOffice, validateGeofence };
