export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface DistanceMatrixResult {
  distanceMeters: number;
  durationSeconds: number;
}

export interface DirectionsResult {
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface IMapsService {
  getDistanceAndDuration(origin: LatLng, destination: LatLng): Promise<DistanceMatrixResult>;
  getDirections(origin: LatLng, destination: LatLng): Promise<DirectionsResult>;
  reverseGeocode(location: LatLng): Promise<{ formattedAddress: string }>;
}
