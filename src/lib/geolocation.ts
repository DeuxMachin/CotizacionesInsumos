export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to get address using geocoding API
        let address: string | undefined;
        try {
          const response = await fetch(`/api/geocoding?action=reverse&lat=${latitude}&lng=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            address = data.formatted_address || data.display_name;
          }
        } catch (error) {
          console.warn('Failed to get address:', error);
        }

        resolve({
          lat: latitude,
          lng: longitude,
          address
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}