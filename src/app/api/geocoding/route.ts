import { NextRequest, NextResponse } from 'next/server';


const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'; // El servicio de geocodificación de Nominatim osea la API de OpenStreetMap
// Simple in-memory cache (best-effort, may not persist across serverless instances)
const SEARCH_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REVERSE_TTL_MS = 5 * 60 * 1000;
const searchCache = new Map<string, { ts: number; data: any }>();
const reverseCache = new Map<string, { ts: number; data: any }>();

// Es el build del user agent que se enviara a nominatim con el formato NOMBRE DE LA EMPRESA/VERSION (contact: EMAIL)
function buildUserAgent() {
  // Nominatim requires a valid identifying User-Agent. Optionally allow override via env.
  const fromEnv = process.env.NOMINATIM_USER_AGENT;
  return fromEnv && fromEnv.trim().length > 0
    ? fromEnv
    : 'empresa-cotizaciones/1.0 (contact: admin@example.com)'; // Cambiar a soporte@tu-dominio.com cuando se pase a produccion 
}

function pickCity(addr: Record<string, string | undefined>) {
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    addr.suburb ||
    addr.hamlet ||
    null
  );
}

function pickComuna(addr: Record<string, string | undefined>) {
  // In Chile, "comuna" can map to municipality/county/city_district depending on OSM data
  return (
    addr.municipality ||
    addr.city_district ||
    addr.county ||
    addr.suburb ||
    null
  );
}

function pickRegion(addr: Record<string, string | undefined>) {
  return addr.state || addr.region || null;
}

function normalizeAddressComponents(addr: any) {
  const components: Array<{ long_name: string; short_name: string; types: string[] }> = [];
  if (addr.road) {
    components.push({ long_name: addr.road, short_name: addr.road, types: ['route'] });
  }
  const city = pickCity(addr);
  if (city) {
    components.push({ long_name: city, short_name: city, types: ['locality'] });
  }
  const comuna = pickComuna(addr);
  if (comuna) {
    components.push({ long_name: comuna, short_name: comuna, types: ['administrative_area_level_2'] });
  }
  const region = pickRegion(addr);
  if (region) {
    components.push({ long_name: region, short_name: region, types: ['administrative_area_level_1'] });
  }
  return components;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'search') {
      const q = searchParams.get('q');
      if (!q || q.trim().length < 3) {
        return NextResponse.json({ results: [] });
      }
      const key = q.trim().toLowerCase();
      const cached = searchCache.get(key);
      const now = Date.now();
      if (cached && now - cached.ts < SEARCH_TTL_MS) {
        return NextResponse.json(cached.data, { headers: { 'Cache-Control': 'public, max-age=60' } });
      }
      const url = new URL(`${NOMINATIM_BASE}/search`);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('q', q);
      url.searchParams.set('limit', '5');
      // Prefer Chile results first
      url.searchParams.set('countrycodes', 'cl');
      url.searchParams.set('accept-language', 'es');

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': buildUserAgent(),
        },
        // Revalidate frequently but allow caching a bit
        next: { revalidate: 60 },
      });
      if (!res.ok) {
        throw new Error(`Nominatim search failed: ${res.status}`);
      }
      const data: any[] = await res.json();
      const results = data.map((item) => {
        const addr = item.address || {};
        const house = addr.house_number;
        const road = addr.road;
        const line1 = [house, road].filter(Boolean).join(' ').trim();
        const fallbackLine1 = addr.road || addr.neighbourhood || addr.suburb || item.display_name?.split(',')[0];
        const main = line1 || fallbackLine1;
        const secondary = item.display_name?.split(',').slice(1).join(',').trim();
        return {
          place_id: String(item.place_id || item.osm_id || item.placeId || Math.random()),
          description: item.display_name,
          structured_formatting: {
            main_text: main || item.display_name,
            secondary_text: secondary || '',
          },
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon || item.lng),
          address: item.address,
        };
      });
      const payload = { results };
      searchCache.set(key, { ts: now, data: payload });
      return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, max-age=60' } });
    }

    if (action === 'reverse') {
      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      if (!lat || !lng) {
        return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
      }
      const key = `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
      const cached = reverseCache.get(key);
      const now = Date.now();
      if (cached && now - cached.ts < REVERSE_TTL_MS) {
        return NextResponse.json(cached.data, { headers: { 'Cache-Control': 'public, max-age=60' } });
      }
      const url = new URL(`${NOMINATIM_BASE}/reverse`);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('lat', lat);
      url.searchParams.set('lon', lng);
      url.searchParams.set('accept-language', 'es');

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': buildUserAgent(),
        },
        next: { revalidate: 30 },
      });
      if (!res.ok) {
        throw new Error(`Nominatim reverse failed: ${res.status}`);
      }
      const data: any = await res.json();
      const addr = data.address || {};
      const city = pickCity(addr);
      const region = pickRegion(addr);
      const comuna = pickComuna(addr);
      const formatted = data.display_name || `${lat}, ${lng}`;
      const payload = {
        lat: Number(lat),
        lng: Number(lng),
        formatted_address: formatted,
        address_components: normalizeAddressComponents(addr),
        ciudad: city,
        region,
        comuna,
      };
      reverseCache.set(key, { ts: now, data: payload });
      return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, max-age=60' } });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.error('[geocoding] error', err);
    return NextResponse.json({ error: err?.message || 'Geocoding error' }, { status: 500 });
  }
}
