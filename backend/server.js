import express from "express";
import connectDB from "./db.js";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
connectDB(); // Connect to MongoDB
app.use(express.json());
app.use(cors()); // Allow requests from 

app.get("/api/geocode", async (req, res) => {
    const location = req.query.location;
    console.log("Received location request:", location);

    if (!location) {
        return res.status(400).json({ error: "Location is required" });
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await response.json();

        console.log("API Response:", data); // Debugging

        if (data.length === 0) {
            return res.status(404).json({ error: "No coordinates found" });
        }

        res.json([{ lat: data[0].lat, lon: data[0].lon }]); // Send first result
    } catch (error) {
        console.error("Error fetching geocode data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/", (req, res) => {
    res.send({
      activeStatus: true,
      error:false
    })
  }
  );


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
