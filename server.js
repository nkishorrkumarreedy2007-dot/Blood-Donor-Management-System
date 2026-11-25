const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "donors.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

function readDonors() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDonors(donors) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(donors, null, 2), "utf8");
}

function validateDonor(body) {
  const required = ["name", "age", "gender", "bloodGroup", "phone", "city"];
  for (const key of required) {
    if (body[key] === undefined || String(body[key]).trim() === "") {
      return `${key} is required`;
    }
  }
  const age = Number(body.age);
  if (!Number.isInteger(age) || age < 18 || age > 65) {
    return "Donor age must be between 18 and 65";
  }
  if (!/^[0-9+\-\s()]{7,20}$/.test(String(body.phone).trim())) {
    return "Enter a valid phone number";
  }
  const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  if (!groups.includes(body.bloodGroup)) return "Select a valid blood group";
  if (!["Male", "Female", "Other"].includes(body.gender)) return "Select a valid gender";
  return null;
}

app.get("/api/donors", (req, res) => {
  let donors = readDonors();
  const { bloodGroup, search } = req.query;
  if (bloodGroup && bloodGroup !== "All") {
    donors = donors.filter(d => d.bloodGroup === bloodGroup);
  }
  if (search) {
    const q = String(search).toLowerCase();
    donors = donors.filter(d =>
      [d.name, d.city, d.phone, d.bloodGroup].some(v => String(v).toLowerCase().includes(q))
    );
  }
  donors.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(donors);
});

app.get("/api/stats", (_req, res) => {
  const donors = readDonors();
  const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const byGroup = Object.fromEntries(groups.map(g => [g, donors.filter(d => d.bloodGroup === g).length]));
  res.json({ total: donors.length, available: donors.filter(d => d.available).length, byGroup });
});

app.post("/api/donors", (req, res) => {
  const error = validateDonor(req.body);
  if (error) return res.status(400).json({ error });
  const donors = readDonors();
  const phone = String(req.body.phone).trim();
  if (donors.some(d => d.phone === phone)) {
    return res.status(409).json({ error: "A donor with this phone number is already registered" });
  }
  const donor = {
    id: crypto.randomUUID(),
    name: String(req.body.name).trim(),
    age: Number(req.body.age),
    gender: req.body.gender,
    bloodGroup: req.body.bloodGroup,
    phone,
    email: String(req.body.email || "").trim(),
    city: String(req.body.city).trim(),
    address: String(req.body.address || "").trim(),
    available: req.body.available !== false,
    createdAt: new Date().toISOString()
  };
  donors.push(donor);
  writeDonors(donors);
  res.status(201).json(donor);
});

app.put("/api/donors/:id", (req, res) => {
  const error = validateDonor(req.body);
  if (error) return res.status(400).json({ error });
  const donors = readDonors();
  const index = donors.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Donor not found" });
  const phone = String(req.body.phone).trim();
  if (donors.some(d => d.phone === phone && d.id !== req.params.id)) {
    return res.status(409).json({ error: "Another donor already uses this phone number" });
  }
  donors[index] = {
    ...donors[index],
    name: String(req.body.name).trim(),
    age: Number(req.body.age),
    gender: req.body.gender,
    bloodGroup: req.body.bloodGroup,
    phone,
    email: String(req.body.email || "").trim(),
    city: String(req.body.city).trim(),
    address: String(req.body.address || "").trim(),
    available: req.body.available !== false,
    updatedAt: new Date().toISOString()
  };
  writeDonors(donors);
  res.json(donors[index]);
});

app.delete("/api/donors/:id", (req, res) => {
  const donors = readDonors();
  const filtered = donors.filter(d => d.id !== req.params.id);
  if (filtered.length === donors.length) return res.status(404).json({ error: "Donor not found" });
  writeDonors(filtered);
  res.json({ message: "Donor deleted successfully" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Blood Donor Management System running at http://localhost:${PORT}`));
