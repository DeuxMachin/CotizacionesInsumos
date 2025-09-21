import { NextRequest, NextResponse } from 'next/server';


const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'; // El servicio de geocodificación de Nominatim osea la API de OpenStreetMap
// Simple in-memory cache (best-effort, may not persist across serverless instances)
const SEARCH_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REVERSE_TTL_MS = 5 * 60 * 1000;
type SearchPayload = { results: Array<{ place_id: string; description: string; structured_formatting: { main_text: string; secondary_text: string }; lat: number; lng: number; address?: Record<string, unknown> }> };
type ReversePayload = { lat: number; lng: number; formatted_address: string; address_components: Array<{ long_name: string; short_name: string; types: string[] }>; ciudad?: string | null; region?: string | null; comuna?: string | null };
const searchCache = new Map<string, { ts: number; data: unknown }>();
const reverseCache = new Map<string, { ts: number; data: unknown }>();

// Es el build del user agent que se enviara a nominatim con el formato NOMBRE DE LA EMPRESA/VERSION (contact: EMAIL)
function buildUserAgent() {
  // Nominatim requires a valid identifying User-Agent. Optionally allow override via env.
  const fromEnv = process.env.NOMINATIM_USER_AGENT;
  return fromEnv && fromEnv.trim().length > 0
    ? fromEnv
    : 'empresa-cotizaciones/1.0 (contact: admin@example.com)'; // Cambiar a soporte@tu-dominio.com cuando se pase a produccion 
}

function pickCity(addr: Record<string, unknown>) {
  const city = addr['city'];
  const town = addr['town'];
  const village = addr['village'];
  const municipality = addr['municipality'];
  const city_district = addr['city_district'];
  const suburb = addr['suburb'];
  const hamlet = addr['hamlet'];
  return (typeof city === 'string' && city) || (typeof town === 'string' && town) || (typeof village === 'string' && village) || (typeof municipality === 'string' && municipality) || (typeof city_district === 'string' && city_district) || (typeof suburb === 'string' && suburb) || (typeof hamlet === 'string' && hamlet) || null;
}

function pickComuna(addr: Record<string, unknown>) {
  const municipality = addr['municipality'];
  const city_district = addr['city_district'];
  const county = addr['county'];
  const suburb = addr['suburb'];
  return (typeof municipality === 'string' && municipality) || (typeof city_district === 'string' && city_district) || (typeof county === 'string' && county) || (typeof suburb === 'string' && suburb) || null;
}

function pickRegion(addr: Record<string, unknown>) {
  const state = addr['state'];
  const region = addr['region'];
  return (typeof state === 'string' && state) || (typeof region === 'string' && region) || null;
}

function normalizeAddressComponents(addr: Record<string, unknown>) {
  const components: Array<{ long_name: string; short_name: string; types: string[] }> = [];
  const road = typeof addr['road'] === 'string' ? addr['road'] : undefined;
  if (road) components.push({ long_name: road, short_name: road, types: ['route'] });
  const city = pickCity(addr);
  if (city) components.push({ long_name: city, short_name: city, types: ['locality'] });
  const comuna = pickComuna(addr);
  if (comuna) components.push({ long_name: comuna, short_name: comuna, types: ['administrative_area_level_2'] });
  const region = pickRegion(addr);
  if (region) components.push({ long_name: region, short_name: region, types: ['administrative_area_level_1'] });
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
      const data = await res.json() as Array<Record<string, unknown>>;
      const results = data.map((item) => {
        const addr = (item['address'] as Record<string, unknown>) || {};
        const house = typeof addr['house_number'] === 'string' ? addr['house_number'] : undefined;
        const road = typeof addr['road'] === 'string' ? addr['road'] : undefined;
        const line1 = [house, road].filter(Boolean).join(' ').trim();
        const displayName = typeof item['display_name'] === 'string' ? item['display_name'] : '';
        const fallbackLine1 = road || (typeof addr['neighbourhood'] === 'string' ? addr['neighbourhood'] : undefined) || (typeof addr['suburb'] === 'string' ? addr['suburb'] : undefined) || displayName.split(',')[0];
        const main = line1 || fallbackLine1;
        const secondary = displayName.split(',').slice(1).join(',').trim();
        const latRaw = item['lat'];
        const lonRaw = item['lon'] ?? item['lng'];
        const lat = typeof latRaw === 'string' || typeof latRaw === 'number' ? Number(latRaw) : NaN;
        const lon = typeof lonRaw === 'string' || typeof lonRaw === 'number' ? Number(lonRaw) : NaN;
        return {
          place_id: String(item['place_id'] ?? item['osm_id'] ?? item['placeId'] ?? Math.random()),
          description: displayName,
          structured_formatting: {
            main_text: main || displayName,
            secondary_text: secondary || '',
          },
          lat: Number.isNaN(lat) ? 0 : lat,
          lng: Number.isNaN(lon) ? 0 : lon,
          address: addr,
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
  const data = await res.json() as Record<string, unknown>;
  const addr = (data['address'] as Record<string, unknown>) || {};
  const city = pickCity(addr);
  const region = pickRegion(addr);
  const comuna = pickComuna(addr);
  const formatted = typeof data['display_name'] === 'string' ? data['display_name'] : `${lat}, ${lng}`;
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[geocoding] error', err);
      return NextResponse.json({ error: err.message || 'Geocoding error' }, { status: 500 });
    }
    console.error('[geocoding] error (unknown)', err);
    return NextResponse.json({ error: 'Geocoding error' }, { status: 500 });
  }
}
