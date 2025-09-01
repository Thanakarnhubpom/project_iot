<template>
  <v-app>
    <v-main class="dashboard-background d-flex justify-center align-center">
      <v-container class="fill-height d-flex justify-center align-center">
        <v-card class="glass-card pa-8" elevation="16">
          <!-- Title -->
          <v-card-title class="text-center mb-6">
            <h1 class="text-gradient">Power Dashboard</h1>
          </v-card-title>

          <!-- Status Circular + Light Bulb -->
          <div class="d-flex justify-center mb-6 flex-column align-center">
            <!-- วงกลมรอบตัวเลข -->
            <v-progress-circular
              :value="power === '1' ? 100 : 0"
              size="180"
              width="18"
              :color="power === '1' ? 'green lighten-1' : 'red lighten-1'"
              class="mb-4"
              indeterminate
              rotate="360"
            >
              <div class="text-h2 font-weight-bold">{{ power }}</div>
            </v-progress-circular>

            <!-- หลอดไฟแสดงสถานะ -->
            <v-icon
              size="60"
              :color="power === '1' ? '#ffd600' : '#9e9e9e'"
              class="mb-4"
            >
              mdi-lightbulb
            </v-icon>
          </div>

          <!-- Buttons -->
          <div class="d-flex justify-center flex-wrap">
            <v-btn color="green darken-1" class="ma-2 white--text" @click="sendPower('1')">
              เปิด (1)
            </v-btn>
            <v-btn color="red darken-1" class="ma-2 white--text" @click="sendPower('0')">
              ปิด (0)
            </v-btn>
            <v-btn color="blue darken-2" class="ma-2 white--text" @click="$router.push('/showData')">
              กลับ
            </v-btn>
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import mqtt from "mqtt";
import axios from "axios";

export default {
  data() {
    return {
      power: "0", // ค่า power ปัจจุบัน
      client: null, // ตัวเชื่อมต่อ MQTT
      MQTT_SERVER: "ws://broker.hivemq.com:8000/mqtt", // MQTT Server
      POWER_TOPIC: "thanakarn/sw1", // topic ที่ใช้ส่งค่า
      POWER_RESP: "re_thanakarn/sw1", // topic ที่ใช้รับค่า
    };
  },
  mounted() {
    // ตรวจสอบ token ถ้าไม่มีให้กลับไปหน้า login
    const token = localStorage.getItem("token");
    if (!token) {
      this.$router.push("/login");
      return;
    }

    this.connectMQTT();      // เชื่อมต่อ MQTT
    this.fetchPowerStatus(); // ดึงค่า power ล่าสุดจาก server
  },
  beforeUnmount() {
    if(this.client) this.client.end(); // ปิดการเชื่อมต่อ MQTT เมื่อออกจากหน้า
  },
  methods: {
    connectMQTT() {
      this.client = mqtt.connect(this.MQTT_SERVER); // เชื่อมต่อ MQTT Broker

      this.client.on("connect", () => {
        console.log("MQTT Connected");
        this.client.subscribe(this.POWER_RESP); // สมัครรับข้อความจาก POWER_RESP
      });

      this.client.on("message", (topic, message) => {
        if(topic === this.POWER_RESP){
          this.power = message.toString(); // อัปเดตค่า power เมื่อมีข้อความใหม่
        }
      });

      this.client.on("error", err => {
        console.error("MQTT Error:", err);
      });
    },

    async sendPower(value) {
      try {
        this.power = value; // อัปเดตค่าที่หน้าเว็บ
        await axios.post("http://localhost:7000/power", { value }); // ส่งค่าไป server
      } catch(err) {
        console.error("Error sending power:", err);
      }
    },

    async fetchPowerStatus() {
      try {
        const res = await axios.get("http://localhost:7000/power"); // ขอค่าล่าสุดจาก server
        this.power = res.data.power; // เก็บค่า power มาใช้ในหน้าเว็บ
      } catch(err) {
        console.error("Error fetching power status:", err);
      }
    }
  }
};
</script>

<style scoped>
/* Background Image + Gradient Overlay */
.dashboard-background {
  min-height: 100vh;
  background: 
    linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), /* ทำพื้นหลังเข้มขึ้นให้สีเด่น */
    url('https://images.unsplash.com/photo-1680957928739-6a3f943ec35a?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')
    center/cover no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Glass Card ปรับให้เด่นขึ้น + Neon Edge */
.glass-card {
  background: rgba(255, 255, 255, 0.15); /* โปร่งใสมาก */
  backdrop-filter: blur(25px) saturate(200%); 
  -webkit-backdrop-filter: blur(25px) saturate(200%); 
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4); 
  box-shadow: 0 0 40px rgba(0, 200, 255, 0.4), 0 8px 32px rgba(0, 0, 0, 0.25);
  text-align: center;
  padding: 2rem;
  transition: all 0.3s ease-in-out;
}

/* Gradient Title */
.text-gradient {
  background: linear-gradient(90deg, #ffffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 2.2rem;
  letter-spacing: 1px;
  text-shadow: 0 2px 10px rgba(231, 51, 255, 0.5);
}

/* วงกลมรอบตัวเลข */
.v-progress-circular {
  transition: all 0.7s ease-in-out;
}
.v-progress-circular > div {
  color: #ffffff; /* ตัวเลขสีขาวเด่น */
  transition: all 0.7s ease-in-out;
}

/* หลอดไฟแสดงสถานะ */
.v-icon {
  transition: all 0.5s ease-in-out;
  filter: drop-shadow(0 0 8px #ffd600);
}

/* ปรับปุ่มให้สดใสตัดกับพื้นหลัง */
.v-btn.green.darken-1 {
  background: linear-gradient(90deg, #00c853, #b2ff59);
  color: #000;
  font-weight: bold;
  box-shadow: 0 0 10px #00c853;
}
.v-btn.red.darken-1 {
  background: linear-gradient(90deg, #d50000, #ff8a80);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 10px #d50000;
}
.v-btn.blue.darken-2 {
  background: linear-gradient(90deg, #2979ff, #82b1ff);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 10px #2979ff;
}

/* Hover effect */
.v-btn:hover {
  transform: scale(1.05);
  transition: all 0.2s ease-in-out;
}

</style>
