import { NearbyPlace, PlaceCategory } from '../types';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

class PlacesService {
  private cache: Map<string, { timestamp: number; places: NearbyPlace[] }> = new Map();
  private isFetching = false;

  public async fetchNearbyPlaces(
    lat: number,
    lng: number,
    category: PlaceCategory = 'all',
    radiusMeters: number = 2200
  ): Promise<NearbyPlace[]> {
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${category}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.places;
    }

    // Build Overpass QL Query
    let queryBody = '';
    if (category === 'mosque') {
      queryBody = `
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
        node["amenity"="place_of_worship"](around:${radiusMeters},${lat},${lng});
      `;
    } else if (category === 'hospital') {
      queryBody = `
        node["amenity"~"hospital|clinic|doctors|pharmacy"](around:${radiusMeters},${lat},${lng});
        way["amenity"~"hospital|clinic"](around:${radiusMeters},${lat},${lng});
      `;
    } else if (category === 'school') {
      queryBody = `
        node["amenity"~"school|college|university|kindergarten"](around:${radiusMeters},${lat},${lng});
        way["amenity"~"school|college|university"](around:${radiusMeters},${lat},${lng});
      `;
    } else if (category === 'restaurant') {
      queryBody = `
        node["amenity"~"restaurant|fast_food|cafe"](around:${radiusMeters},${lat},${lng});
        way["amenity"~"restaurant|fast_food"](around:${radiusMeters},${lat},${lng});
      `;
    } else if (category === 'fuel') {
      queryBody = `
        node["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
        way["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
      `;
    } else if (category === 'park') {
      queryBody = `
        node["leisure"~"park|garden|playground"](around:${radiusMeters},${lat},${lng});
        way["leisure"~"park|garden"](around:${radiusMeters},${lat},${lng});
      `;
    } else if (category === 'atm') {
      queryBody = `
        node["amenity"~"atm|bank"](around:${radiusMeters},${lat},${lng});
      `;
    } else if (category === 'shop') {
      queryBody = `
        node["shop"](around:${radiusMeters},${lat},${lng});
        way["shop"](around:${radiusMeters},${lat},${lng});
      `;
    } else {
      // 'all' category - fetch major hubs
      queryBody = `
        node["amenity"~"place_of_worship|hospital|clinic|school|fuel|restaurant|cafe|fast_food|atm|bank"](around:${radiusMeters},${lat},${lng});
        node["leisure"="park"](around:${radiusMeters},${lat},${lng});
        node["shop"~"supermarket|convenience|mall"](around:${radiusMeters},${lat},${lng});
      `;
    }

    const overpassQuery = `[out:json][timeout:15];(${queryBody});out center 40;`;

    try {
      this.isFetching = true;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(overpassQuery)
      });

      if (!res.ok) {
        throw new Error(`Overpass API responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      const elements: OverpassElement[] = data.elements || [];

      const places: NearbyPlace[] = elements
        .filter(el => (el.lat || el.center?.lat) && el.tags?.name)
        .map(el => {
          const itemLat = el.lat || el.center!.lat;
          const itemLng = el.lon || el.center!.lon;
          const tags = el.tags || {};
          const cat = this.detectCategory(tags);

          // Calculate approximate distance
          const distanceMeters = Math.round(this.calculateDistance(lat, lng, itemLat, itemLng));

          const street = tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : '';
          const city = tags['addr:city'] || '';
          const address = [street, city].filter(Boolean).join(', ') || tags.description || '';

          return {
            id: `place_${el.id}`,
            name: tags.name || 'Nearby Landmark',
            category: cat,
            latitude: itemLat,
            longitude: itemLng,
            address,
            distanceMeters,
            cuisine: tags.cuisine,
            openingHours: tags.opening_hours,
            phone: tags.phone || tags['contact:phone'],
            website: tags.website || tags['contact:website']
          };
        })
        .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

      this.cache.set(cacheKey, { timestamp: Date.now(), places });
      return places;
    } catch (err) {
      console.warn('Overpass API lookup skipped or throttled:', err);
      // Fallback: return any cached data or empty array without crashing
      return cached?.places || [];
    } finally {
      this.isFetching = false;
    }
  }

  // Search by city, area, or place name using OpenStreetMap Nominatim
  public async searchPlaces(query: string): Promise<{ name: string; display_name: string; lat: number; lon: number }[]> {
    if (!query.trim() || query.trim().length < 2) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query.trim())}&limit=6&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AfzaalLocationShare/1.0' } });
      if (res.ok) {
        const data = await res.json();
        return data.map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }));
      }
    } catch (e) {
      console.warn('Nominatim place search failed:', e);
    }
    return [];
  }

  private detectCategory(tags: Record<string, string>): PlaceCategory {
    const amenity = tags.amenity || '';
    const leisure = tags.leisure || '';
    const religion = tags.religion || '';
    const shop = tags.shop || '';
    const name = (tags.name || '').toLowerCase();

    if (
      religion === 'muslim' || 
      name.includes('masjid') || 
      name.includes('mosque') || 
      name.includes('jamia') ||
      amenity === 'place_of_worship'
    ) {
      return 'mosque';
    }
    if (['hospital', 'clinic', 'doctors', 'pharmacy'].includes(amenity)) {
      return 'hospital';
    }
    if (['school', 'college', 'university', 'kindergarten'].includes(amenity)) {
      return 'school';
    }
    if (['restaurant', 'fast_food', 'cafe', 'food_court', 'pub'].includes(amenity)) {
      return 'restaurant';
    }
    if (amenity === 'fuel') {
      return 'fuel';
    }
    if (['park', 'garden', 'nature_reserve'].includes(leisure)) {
      return 'park';
    }
    if (['atm', 'bank'].includes(amenity)) {
      return 'atm';
    }
    if (shop) {
      return 'shop';
    }
    return 'other';
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const placesService = new PlacesService();
