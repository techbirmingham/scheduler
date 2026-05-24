const CACHE: Record<string, { lat: number; lng: number }> = {};

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  if (!address) {
    return { lat: 33.5186, lng: -86.8104 };
  }

  if (CACHE[address]) {
    return CACHE[address];
  }

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const url =
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
    encodeURIComponent(address) +
    '.json?access_token=' +
    token;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const [lng, lat] = json.features?.[0]?.center || [-86.8104, 33.5186];
    const coords = { lat, lng };
    CACHE[address] = coords;
    return coords;
  } catch (err) {
    console.warn('Geocoding failed for "' + address + '":', err);
    return { lat: 33.5186, lng: -86.8104 };
  }
}