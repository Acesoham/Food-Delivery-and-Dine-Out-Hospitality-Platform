import { useEffect, useMemo, useRef, useState } from 'react';
import './GoogleMap.css';

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
  title?: string;
};

type GoogleMapProps = {
  markers: MapPoint[];
  path?: MapPoint[];
  fallbackQuery?: string;
  className?: string;
  height?: number;
  zoom?: number;
};

declare global {
  interface Window {
    google?: any;
    __foodHubGoogleMapsInit?: () => void;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'foodhub-google-maps-js';
let googleMapsPromise: Promise<any> | null = null;

const getMapsApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const isValidPoint = (point: MapPoint) =>
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  point.lat >= -90 &&
  point.lat <= 90 &&
  point.lng >= -180 &&
  point.lng <= 180;

const loadGoogleMaps = () => {
  const key = getMapsApiKey();
  if (!key) return Promise.reject(new Error('Google Maps API key is not configured'));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    window.__foodHubGoogleMapsInit = () => resolve(window.google);

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=__foodHubGoogleMapsInit`;
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

const toFallbackQuery = (markers: MapPoint[], fallbackQuery?: string) => {
  if (fallbackQuery) return fallbackQuery;
  const first = markers.find(isValidPoint);
  return first ? `${first.lat},${first.lng}` : '';
};

export const GoogleMap = ({
  markers,
  path,
  fallbackQuery,
  className = '',
  height = 240,
  zoom = 14,
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');

  const validMarkers = useMemo(() => markers.filter(isValidPoint), [markers]);
  const validPath = useMemo(() => (path || []).filter(isValidPoint), [path]);
  const iframeQuery = toFallbackQuery(validMarkers, fallbackQuery);
  const style = { minHeight: height };

  useEffect(() => {
    if (!mapRef.current || validMarkers.length === 0) {
      if (iframeQuery) setLoadState('fallback');
      return;
    }

    let isMounted = true;
    setLoadState('loading');

    loadGoogleMaps()
      .then((google) => {
        if (!isMounted || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: validMarkers[0],
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });

        const bounds = new google.maps.LatLngBounds();
        validMarkers.forEach((marker) => {
          bounds.extend(marker);
          new google.maps.Marker({
            position: marker,
            map,
            title: marker.title || marker.label,
            label: marker.label.slice(0, 1).toUpperCase(),
          });
        });

        if (validPath.length > 1) {
          validPath.forEach((point) => bounds.extend(point));
          new google.maps.Polyline({
            path: validPath,
            map,
            strokeColor: '#f97316',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          });
        }

        if (validMarkers.length > 1 || validPath.length > 1) {
          map.fitBounds(bounds, 56);
        }

        setLoadState('ready');
      })
      .catch(() => {
        if (isMounted) setLoadState('fallback');
      });

    return () => {
      isMounted = false;
    };
  }, [validMarkers, validPath, iframeQuery, zoom]);

  if (loadState === 'fallback' && iframeQuery) {
    return (
      <div className={`google-map ${className}`} style={style}>
        <iframe
          className="google-map-frame"
          title="Google Maps location"
          src={`https://www.google.com/maps?q=${encodeURIComponent(iframeQuery)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  if (validMarkers.length === 0 && !iframeQuery) {
    return (
      <div className={`google-map google-map-empty ${className}`} style={style}>
        <span>Location unavailable</span>
      </div>
    );
  }

  return (
    <div className={`google-map ${className}`} style={style}>
      {loadState === 'loading' && (
        <div className="google-map-status">Loading map...</div>
      )}
      <div ref={mapRef} className="google-map-canvas" />
    </div>
  );
};
