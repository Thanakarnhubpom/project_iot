// ================== Import Libraries ==================
const express = require("express");        // Framework สำหรับสร้าง Web Server
const mqtt = require("mqtt");              // ใช้เชื่อมต่อ MQTT (สื่อสารกับ ESP32)
const mysql = require("mysql2/promise");   // ใช้เชื่อมต่อ MySQL DB
const jwt = require("jsonwebtoken");       // สำหรับสร้าง/ตรวจสอบ JWT Token
const cors = require("cors");              // แก้ปัญหา Cross-Origin
const multer = require("multer");          // สำหรับอัปโหลดไฟล์
const path = require("path");              // จัดการ path ไฟล์

// ================== Server Config ==================
const app = express();
const port = 7000;                         // Port Server
const jwt_SECRET = "123456";               // Secret Key JWT

// ================== Middleware ==================
app.use(cors());                           // อนุญาต CORS
app.use(express.json());                   // รองรับ JSON body
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // เปิดโฟลเดอร์ uploads

// ================== Multer Config ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // ที่เก็บไฟล์
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)), // ตั้งชื่อใหม่
});
const upload = multer({ storage });

// ================== MySQL Database ==================
const db = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "123456",
  database: "member",
});

// ================== MQTT Config ==================
const MQTT_SERVER = "mqtt://broker.hivemq.com:1883"; // MQTT Broker
const POWER_TOPIC = "thanakarn/sw1";                 // Topic ส่งคำสั่ง
const POWER_RESP  = "re_thanakarn/sw1";              // Topic รับสถานะ
const client = mqtt.connect(MQTT_SERVER);            // เชื่อมต่อ MQTT

let lastPower = "0"; // เก็บสถานะไฟล่าสุดใช้สำหรับ ส่งกลับ frontend
// ================== MQTT Events ==================
client.on("connect", () => {
  console.log("MQTT Connected");
  client.subscribe([POWER_RESP]); // สมัครรับ topic สถานะ
});

client.on("message", (topic, message) => {
  if(topic === POWER_RESP){ //ESP32 ส่งสถานะไฟเข้ามา
    lastPower = message.toString(); // อัปเดตสถานะไฟ
    console.log("Power Status:", lastPower);
  }
});

client.on("error", (err) => console.error("MQTT Error:", err));

// ================== MQTT API ==================
// frontend ส่งคำสั่งเปิด/ปิดไฟ
app.post("/power", (req, res) => {
  const { value } = req.body;
  if(value === "0" || value === "1"){
    client.publish(POWER_TOPIC, value);  // ส่งไป ESP32
    lastPower = value;                   // อัปเดตสถานะไฟทันที
    res.json({ status: "ok", message: `ส่งคำสั่งไฟ: ${value}`, power: lastPower });//ส่ง response กลับ frontend เพื่อยืนยันสถานะ
  } else {
    res.status(400).json({ status: "error", message: "ค่าไม่ถูกต้อง" });
  }
});

// frontend ดึงสถานะไฟล่าสุด 
app.get("/power", verifyJWT, (req, res) => {
  res.json({ power: lastPower });//server ส่ง response กลับ
});

// ================== USER ROUTES ==================
// Login 
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);

    if (rows.length === 0)
      return res.status(401).json({ status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, jwt_SECRET, { expiresIn: "1h" });

    res.json({ status: "ok", data: user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ดึงข้อมูลผู้ใช้ทั้งหมด
app.get("/users", verifyJWT, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json({ rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// เพิ่ม user ใหม่
app.post("/insert", verifyJWT, upload.single("pic"), async (req, res) => {
  try {
    const { email, password, status } = req.body;
    const pic = req.file ? req.file.filename : null;
    const [result] = await db.query(
      "INSERT INTO users (email, password, status, pic) VALUES (?, ?, ?, ?)",
      [email, password, status, pic]
    );
    res.json({ status: "ok", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// แก้ไข user
app.post("/edit-user/:id", verifyJWT, upload.single("pic"), async (req, res) => {
  try {
    const id = req.params.id;
    const { email, password, status, picName } = req.body;
    const pic = req.file ? req.file.filename : picName;

    const [result] = await db.query(
      "UPDATE users SET email = ?, password = ?, status = ?, pic = ? WHERE id = ?",
      [email, password, status, pic, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({ status: "ok", message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ลบ user
app.delete("/delete-user/:id", verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({ status: "ok", message: "ลบสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ================== JWT Middleware ==================
function verifyJWT(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // ดึง token จาก header
  if (!token) return res.status(401).json({ status: 'error', message: 'Token required' });

  jwt.verify(token, jwt_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ status: 'error', message: 'Invalid token' });
    req.user = decoded; // เก็บข้อมูล user ไว้ใน req
    next();             // ไปต่อถ้า token ถูกต้อง
  });
}

// ================== Start Server ==================
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
