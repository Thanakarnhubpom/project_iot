<template>
  <v-app>
    <v-main class="login-background d-flex justify-center align-center">
      <v-container class="fill-height d-flex justify-center align-center">
        <!-- Glassmorphic Card -->
        <v-card class="glass-card pa-10" elevation="24">
          <!-- Title -->
          <v-card-title class="text-center mb-8">
            <h1 class="text-gradient">✨ Login to Dashboard ✨</h1>
          </v-card-title>

          <!-- Form -->
          <v-form>
            <v-text-field
              v-model="email"
              label="Email"
              outlined
              dense
              type="email"
              required
              class="mb-6 input-glow"
            ></v-text-field>

            <v-text-field
              v-model="password"
              label="Password"
              outlined
              dense
              type="password"
              required
              class="mb-6 input-glow"
            ></v-text-field>

            <!-- Buttons -->
            <div class="d-flex justify-center flex-wrap">
              <v-btn
                class="btn-glow ma-3"
                @click="doLogin"
              >
                Login
              </v-btn>
              <v-btn
                class="btn-reset ma-3"
                @click="reset"
              >
                Reset
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      email: "",    // เก็บ email ที่กรอก
      password: "", // เก็บ password ที่กรอก
    };
  },
  methods: {
    async doLogin() {
      try {
        // ส่ง email/password ไป server
        const response = await axios.post("http://localhost:7000/login", {
          email: this.email,
          password: this.password,
        });

        if (response.data.status === "ok") {
          const token = response.data.token;
          const user = response.data.data;

          // เก็บ token และข้อมูลผู้ใช้ใน localStorage
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));

          alert("เข้าสู่ระบบสำเร็จ!");
          this.$router.push("/showData"); // ไปหน้า Dashboard
        } else {
          alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
          this.reset();
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    },
    reset() {
      this.email = "";
      this.password = "";
    },
  },
};
</script>

<style scoped>
/* =================== Background =================== */
.login-background {
  min-height: 100vh;
  background: 
    linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
    url('https://images.unsplash.com/photo-1753724933350-c2e0e2990445?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')
    center/cover no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* =================== Glass Card =================== */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 50px rgba(0, 200, 255, 0.4), 0 10px 50px rgba(0, 0, 0, 0.3);
  padding: 3rem;
  text-align: center;
  transition: all 0.3s ease-in-out;
}

/* =================== Gradient Title =================== */
.text-gradient {
  background: linear-gradient(90deg, #ff6ec7, #00f7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 2.5rem;
  text-shadow: 0 2px 15px rgba(0,255,255,0.5);
}

/* =================== Input Glow =================== */
.input-glow input {
  color: #ffffff;
}
.input-glow .v-input__slot::before,
.input-glow .v-input__slot::after {
  border-color: #00f7ff !important;
}
.input-glow input:focus {
  box-shadow: 0 0 15px #00f7ff;
  border-radius: 8px;
}

/* =================== Buttons =================== */
.btn-glow {
  background: linear-gradient(90deg, #ff6ec7, #00f7ff);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 20px #00f7ff, 0 0 40px #ff6ec7;
  transition: all 0.3s ease-in-out;
}
.btn-glow:hover {
  transform: scale(1.08);
  box-shadow: 0 0 30px #00f7ff, 0 0 60px #ff6ec7;
}

.btn-reset {
  background: #333;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 15px #555;
}
.btn-reset:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px #888;
}
</style>
