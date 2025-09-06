// src/global.d.ts or src/google.maps.d.ts
declare global {
    interface Window {
      google: typeof google; // Allow access to the Google Maps API
    }
  }

  export {};
