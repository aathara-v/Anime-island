import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Readable } from "stream";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Ensure database directory exists
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Simple Helper to read/write DB
function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return {};
  }
}

function saveDB(db: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

// Data storage functions below

// Consumet API setup
import { ANIME } from "@consumet/extensions";

const hianime = new ANIME.Hianime();

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mock Routes
app.get("/api/anime/trending", async (req, res) => {
  // Empty array to ensure no anime are shown on the homepage by default.
  res.json({ currentPage: 1, hasNextPage: false, results: [] });
});

app.get("/api/anime/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    if (!query) return res.status(400).json({ error: "Query is required" });
    
    const data = await hianime.search(query, page);
    res.json(data);
  } catch (error: any) {
    console.error("Error searching anime:", error.message);
    res.json({ results: [] });
  }
});

app.get("/api/anime/info", async (req, res) => {
  try {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: "Id is required" });
    
    const data = await hianime.fetchAnimeInfo(id);
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching anime info:", error.message);
    res.status(500).json({ error: "Failed to fetch anime info" });
  }
});

app.get("/api/anime/watch", async (req, res) => {
  try {
    const episodeId = req.query.episodeId as string;
    if (!episodeId) return res.status(400).json({ error: "episodeId is required" });
    
    // Some providers require a server parameter or specific options
    const data = await hianime.fetchEpisodeSources(episodeId);
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching episode sources:", error.message);
    res.status(500).json({ error: "Failed to fetch episode sources" });
  }
});

// Get user history and favorites
app.get("/api/userData", (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = getDB();
  const userData = db[email] || { history: {}, favorites: [] };
  res.json(userData);
});

// Save user history and favorites
app.post("/api/userData", (req, res) => {
  const { email, history, favorites } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = getDB();
  db[email] = {
    history: history || {},
    favorites: favorites || [],
    updatedAt: new Date().toISOString(),
  };
  saveDB(db);

  res.json({ status: "success", data: db[email] });
});

// Integrate Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
