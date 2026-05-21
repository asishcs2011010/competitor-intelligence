const express = require("express");
const { run } = require("./index");

const app = express();
const PORT = process.env.PORT || 3000;

let isRunning = false;  // ← add this

app.get("/", (req, res) => {
  res.send("Qapitol Intelligence Agent is running.");
});

app.post("/run", async (req, res) => {
  if (isRunning) {
    console.log("⚠️ Run already in progress, skipping.");
    return res.status(429).json({ status: "busy", message: "Run already in progress." });
  }
  isRunning = true;
  res.json({ status: "started", message: "Intelligence run triggered." });
  try {
    await run();
  } finally {
    isRunning = false;  // ← always releases even if run() crashes
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});