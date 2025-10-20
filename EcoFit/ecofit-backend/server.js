const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/ecofit_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ MongoDB error:", err));

const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EcoFit backend is running ✅");
});

const User = require("./models/User");

app.post("/api/login", async (req, res) => {
  console.log("⚡️ BODY NHẬN ĐƯỢC TỪ FRONTEND:", req.body); // DEBUG 1

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  console.log("📦 USER TÌM THẤY TRONG DB:", user); // DEBUG 2

  // SAFE CHECK — nếu không tìm thấy user
  if (!user) {
    return res.status(400).json({ message: "Email không tồn tại trong database" });
  }

  // So sánh MỊN — không nên find password chung findOne
  if (user.password !== password) {
    return res.status(400).json({ message: "Sai password" });
  }

  // OK
  res.json({ role: user.role });
});


app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
