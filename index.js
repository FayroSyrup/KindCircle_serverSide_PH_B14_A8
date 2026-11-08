import "dotenv/config";
import express from "express";
import cors from "cors";
import eventRoutes from "./routes/events.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: [process.env.CLIENT_URL, "http://localhost:3000"] }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("KindCircle server is running");
});

// ROUTES GO HERE
app.use("/events", eventRoutes);

// catch any error so we never leak a stack trace
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500).json({ message: "Server error, please try again" });
});

// vercel runs the app itself, so only listen when running locally
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;