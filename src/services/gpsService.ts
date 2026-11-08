import { UserLocation } from '../types';

export type GPSPermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';

export interface GeocodedAddress {
  address: string;
  street: string;
  town: string;
  city: string;
  area: string;
  district: string;
  province: string;
  country: string;
  formattedAddress: string;
}

class GPSService {
  private watchId: number | null = null;
  private simulationInterval: number | null = null;
  private isSimulating: boolean = false;
  private lastKnownLocation: UserLocation | null = null;
  private locationListeners: Set<(loc: UserLocation) => void> = new Set();
  private errorListeners: Set<(err: string) => void> = new Set();

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  }

  public async checkPermission(): Promise<GPSPermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return status.state as GPSPermissionState;
      }
    } catch {
      // Ignore if permissions API not fully available
    }
    return 'prompt';
  }

  public async requestCurrentPosition(): Promise<UserLocation> {
    if (!this.isSupported()) {
      const err = 'Geolocation is not supported by your browser or device.';
      this.notifyError(err);
      throw new Error(err);
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 8);

          const geocoded = await this.reverseGeocode(lat, lng);

          const loc: UserLocation = {
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp || Date.now(),
            address: geocoded.address,
            street: geocoded.street,
            town: geocoded.town,
            city: geocoded.city,
            area: geocoded.area,
            district: geocoded.district,
            province: geocoded.province,
            country: geocoded.country,
            formattedAddress: geocoded.formattedAddress
          };

          this.lastKnownLocation = loc;
          this.notifyLocation(loc);
          resolve(loc);
        },
        (error) => {
          let msg = 'Failed to acquire GPS location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow location access in your browser or device settings to view and share your live GPS location.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'GPS satellite signal is currently unavailable. Please ensure your device location/GPS is switched on.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'GPS request timed out. Retrying satellite lock...';
          }
          this.notifyError(msg);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );
    });
  }

  public startLiveTracking() {
    if (!this.isSupported()) return;
    if (this.watchId !== null) return; // already running

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 6);

        // Keep previous geocoded info if distance is minimal to avoid rate limits
        let geocoded: GeocodedAddress;
        if (
          this.lastKnownLocation &&
          Math.abs(this.lastKnownLocation.latitude - lat) < 0.0005 &&
          Math.abs(this.lastKnownLocation.longitude - lng) < 0.0005 &&
          this.lastKnownLocation.city
        ) {
          geocoded = {
            address: this.lastKnownLocation.address || '',
            street: this.lastKnownLocation.street || '',
            town: this.lastKnownLocation.town || '',
            city: this.lastKnownLocation.city || '',
            area: this.lastKnownLocation.area || '',
            district: this.lastKnownLocation.district || '',
            province: this.lastKnownLocation.province || '',
            country: this.lastKnownLocation.country || '',
            formattedAddress: this.lastKnownLocation.formattedAddress || ''
          };
        } else {
          geocoded = await this.reverseGeocode(lat, lng);
        }

        const loc: UserLocation = {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp || Date.now(),
          address: geocoded.address,
          street: geocoded.street,
          town: geocoded.town,
          city: geocoded.city,
          area: geocoded.area,
          district: geocoded.district,
          province: geocoded.province,
          country: geocoded.country,
          formattedAddress: geocoded.formattedAddress
        };

        this.lastKnownLocation = loc;
        this.notifyLocation(loc);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          this.notifyError('Location permission was denied. Tap "Enable GPS" for instructions.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 4000
      }
    );
  }

  public stopLiveTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.stopSimulation();
  }

  // Real Movement Simulator (for test/preview without walking outside)
  public toggleSimulation(enabled: boolean, baseLoc?: UserLocation) {
    this.isSimulating = enabled;
    if (!enabled) {
      this.stopSimulation();
      return;
    }

    let lat = baseLoc?.latitude || this.lastKnownLocation?.latitude || 37.7749;
    let lng = baseLoc?.longitude || this.lastKnownLocation?.longitude || -122.4194;
    let angle = 0;

    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = window.setInterval(async () => {
      angle += 0.08;
      lat += Math.sin(angle) * 0.00025;
      lng += Math.cos(angle) * 0.00025;

      const loc: UserLocation = {
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        accuracy: 4 + Math.floor(Math.random() * 3),
        heading: Math.round((angle * (180 / Math.PI)) % 360),
        speed: 1.3 + Math.random() * 0.3,
        timestamp: Date.now(),
        address: this.lastKnownLocation?.address || 'Simulated Walking Path',
        city: this.lastKnownLocation?.city || 'San Francisco',
        area: this.lastKnownLocation?.area || 'Market Street',
        district: this.lastKnownLocation?.district || 'San Francisco County',
        country: this.lastKnownLocation?.country || 'United States',
        formattedAddress: 'Live GPS Broadcast • Moving at walking pace'
      };
      this.lastKnownLocation = loc;
      this.notifyLocation(loc);
    }, 2500);
  }

  public isSimulationActive(): boolean {
    return this.isSimulating;
  }

  private stopSimulation() {
    this.isSimulating = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  public onLocationUpdate(cb: (loc: UserLocation) => void): () => void {
    this.locationListeners.add(cb);
    if (this.lastKnownLocation) cb(this.lastKnownLocation);
    return () => this.locationListeners.delete(cb);
  }

  public onError(cb: (err: string) => void): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  private notifyLocation(loc: UserLocation) {
    this.locationListeners.forEach(cb => {
      try { cb(loc); } catch (e) { console.error(e); }
    });
  }

  private notifyError(err: string) {
    this.errorListeners.forEach(cb => {
      try { cb(err); } catch (e) { console.error(e); }
    });
  }

  public async reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AfzaalLocationShare/1.0' } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const street = addr.road || addr.street || addr.pedestrian || '';
        const town = addr.town || addr.village || addr.hamlet || '';
        const city = addr.city || addr.town || addr.municipality || '';
        const area = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || street || '';
        const district = addr.county || addr.city_district || addr.district || '';
        const province = addr.state || addr.province || addr.region || '';
        const country = addr.country || '';

        const primaryParts = [street, area, town || city, district, province, country].filter(Boolean);
        const address = primaryParts.slice(0, 4).join(', ') || data.display_name || `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;

        return {
          address,
          street,
          town,
          city: city || town,
          area,
          district,
          province,
          country,
          formattedAddress: data.display_name || address
        };
      }
    } catch {
      // Network or rate-limit fallback
    }

    return {
      address: `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
      street: '',
      town: '',
      city: '',
      area: '',
      district: '',
      province: '',
      country: '',
      formattedAddress: `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° W`
    };
  }
}

export const gpsService = new GPSService();
