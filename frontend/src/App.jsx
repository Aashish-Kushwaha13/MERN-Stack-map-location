import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const blueIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
});

const redIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
});

// Component to Center Map on Route or Current Location
const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

const RealTimeMap = () => {
  const [initialLocation, setInitialLocation] = useState("Fetching Current Location...");
  const [destinationLocation, setDestinationLocation] = useState(""); // No default destination
  const [initialCoords, setInitialCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null); // No default destination coords
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get user current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setInitialCoords(coords);
        setInitialLocation("Your Current Location");
      },
      (error) => console.error("Error getting location:", error),
      { enableHighAccuracy: true }
    );
  }, []);

  // Fetch coordinates from API
  const getCoordinates = async (location) => {
    try {
      setLoading(true);
      const response = await fetch(`https://mern-stack-map-location.vercel.app/api/geocode?location=${location}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      else return null;
    } catch (error) {
      console.error("Error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch shortest route using OSRM API
  const getShortestRoute = async (startCoords, endCoords) => {
    if (!startCoords || !endCoords) return;
    setLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes.length > 0) {
        setRoute(data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]));
        setDistance((data.routes[0].distance / 1000).toFixed(2)); // km
        setDuration((data.routes[0].duration / 60).toFixed(2)); // minutes
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!initialLocation || !destinationLocation) {
      alert("Please enter both source and destination.");
      return;
    }
    const endCoords = await getCoordinates(destinationLocation);
    if (endCoords) {
      setDestinationCoords(endCoords);
      getShortestRoute(initialCoords, endCoords);
    }
  };

  const switchLocations = async () => {
    setInitialLocation(destinationLocation);
    setDestinationLocation(initialLocation);
    setInitialCoords(destinationCoords);
    setDestinationCoords(initialCoords);
    if (destinationCoords && initialCoords) {
      await getShortestRoute(destinationCoords, initialCoords);
    }
  };

  return (
    <div className="p-4 w-full max-w-6xl mx-auto">
      {/* Search Box */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <button onClick={() => setInitialLocation("Your Current Location")} className="bg-gray-500 text-white px-4 py-2 rounded-md shadow-md">
          📍 Source
        </button>
        <input
          type="text"
          value={initialLocation}
          onChange={(e) => setInitialLocation(e.target.value)}
          className="border p-2 w-full md:w-1/2 rounded-md shadow-sm"
          placeholder="Enter Source Location"
        />
        <button onClick={switchLocations} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md">
          🔄 Swap
        </button>
        <input
          type="text"
          value={destinationLocation}
          onChange={(e) => setDestinationLocation(e.target.value)}
          className="border p-2 w-full md:w-1/2 rounded-md shadow-sm"
          placeholder="Enter Destination Location"
        />
        <button onClick={handleSearch} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md">
          🔍 Search
        </button>
      </div>

      {/* Route Info */}
      {distance && duration && (
        <div className="bg-white p-3 rounded-lg shadow-md text-center mb-3">
          <h3 className="text-lg font-bold">🚗 Route Information</h3>
          <p>📏 Distance: <span className="font-semibold">{distance} km</span></p>
          <p>⏳ Estimated Time: <span className="font-semibold">{duration} minutes</span></p>
        </div>
      )}

      {/* Map */}
      <div className="w-full h-[500px] md:h-[600px]">
        <MapContainer center={initialCoords || [20, 78]} zoom={5} className="h-full w-full rounded-lg shadow-lg">
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Default">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer url="https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} />
            </LayersControl.BaseLayer>
          </LayersControl>

          <ChangeView center={initialCoords} />
          {initialCoords && <Marker position={initialCoords} icon={blueIcon}><Popup>📍 {initialLocation}</Popup></Marker>}
          {destinationCoords && <Marker position={destinationCoords} icon={redIcon}><Popup>📍 {destinationLocation}</Popup></Marker>}
          {destinationCoords && route.length > 0 && <Polyline positions={route} color="blue" weight={6} dashArray="10, 10" opacity={0.8} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default RealTimeMap;
