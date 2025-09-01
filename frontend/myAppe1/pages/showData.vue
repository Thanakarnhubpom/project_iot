<template>
  <v-app dark>
    <v-main class="app-background">
      <v-container class="pa-4">
        <!-- Toolbar -->
        <v-toolbar flat class="gradient-toolbar rounded-lg mb-6 elevation-6">
          <v-toolbar-title class="text-h6 white--text glow-text">
            <v-icon class="me-2 animated-icon" size="28">mdi-account-group</v-icon>
            สมาชิก
          </v-toolbar-title>
          <v-spacer></v-spacer>
            <!-- ปุ่ม Dashboard -->
          <v-btn class="gradient-btn-green me-2" rounded @click="$router.push('/dashboard')">
           <v-icon left>mdi-view-dashboard</v-icon> Dashboard
          </v-btn>
          <v-btn class="gradient-btn-purple me-2" rounded @click="addUser">
            <v-icon left>mdi-plus</v-icon> เพิ่มสมาชิก
          </v-btn>
          <v-btn class="gradient-btn-red-purple" rounded @click="logout">
            <v-icon left>mdi-logout</v-icon> Logout
          </v-btn>
        </v-toolbar>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="users"
          class="elevation-4 rounded-lg custom-table"
          :hide-default-footer="users.length < 10"
          dense
          mobile-breakpoint="960"
        >
          <!-- Picture slot -->
          <template v-slot:item.pic="{ item }">
            <v-avatar size="50" class="mx-auto avatar-shadow">
              <v-img
                :src="item.pic ? `http://localhost:7000/uploads/${item.pic}` : 'https://via.placeholder.com/50'"
                class="rounded-lg"
              />
            </v-avatar>
          </template>

          <!-- Actions slot -->
          <template v-slot:item.actions="{ item }">
            <v-tooltip top>
              <template #activator="{ props }">
                <v-btn icon class="btn-action-purple" v-bind="props" @click="editUser(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>แก้ไข</span>
            </v-tooltip>
            <v-tooltip top>
              <template #activator="{ props }">
                <v-btn icon class="btn-action-red-purple" v-bind="props" @click="deleteUser(item.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>ลบ</span>
            </v-tooltip>
          </template>

          <!-- No data -->
          <template v-slot:no-data>
            <v-row justify="center" class="pa-4">
              <v-col cols="12" class="text-center">
                <v-icon size="48" color="grey lighten-1">mdi-database-off</v-icon>
                <div class="text-subtitle-1 mt-2 mb-4 glow-text">ไม่มีข้อมูลสมาชิก</div>
                <v-btn class="gradient-btn-purple" rounded @click="loadUsers">
                  <v-icon left>mdi-refresh</v-icon> โหลดข้อมูล
                </v-btn>
              </v-col>
            </v-row>
          </template>
        </v-data-table>

        <!-- Dialog Form -->
        <v-dialog v-model="dialog" max-width="500">
          <v-card class="rounded-lg elevation-6 dialog-shadow">
            <v-card-title class="text-h6 font-weight-bold glow-text">
              {{ isEditing ? "แก้ไขสมาชิก" : "เพิ่มสมาชิก" }}
            </v-card-title>

            <v-card-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="record.email"
                    label="Email"
                    outlined
                    dense
                    prepend-inner-icon="mdi-email"
                    color="purple lighten-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="record.password"
                    label="Password"
                    type="password"
                    outlined
                    dense
                    prepend-inner-icon="mdi-lock"
                    color="purple lighten-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="record.status"
                    label="Status"
                    outlined
                    dense
                    prepend-inner-icon="mdi-information"
                    color="purple lighten-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" class="text-center">
                  <v-file-input
                    v-model="dialogFile"
                    label="เลือกรูป"
                    accept="image/*"
                    outlined
                    dense
                    prepend-icon="mdi-camera"
                  ></v-file-input>
                  <v-img
                    v-if="record.pic"
                    :src="`http://localhost:7000/uploads/${record.pic}`"
                    max-width="140"
                    class="mt-3 rounded-lg mx-auto elevation-4"
                  ></v-img>
                </v-col>
              </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="justify-end">
              <v-btn color="grey lighten-1" rounded text @click="dialog = false">Cancel</v-btn>
              <v-btn class="gradient-btn-purple" rounded @click="save">
                <v-icon left>mdi-content-save</v-icon> Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import axios from "axios"; // นำเข้า axios สำหรับเรียก API

export default {
  data() {
    return {
      // กำหนด header ของตารางสมาชิก
      headers: [
        { title: "ID", value: "id" },
        { title: "Email", value: "email" },
        { title: "Password", value: "password" },
        { title: "Status", value: "status" },
        { title: "Picture", value: "pic" },
        { title: "Actions", value: "actions", sortable: false }, // ปุ่มแก้ไข/ลบไม่สามารถ sort
      ],

      users: [],             // เก็บข้อมูลสมาชิกที่ดึงจาก backend
      dialog: false,         // ควบคุมการเปิด/ปิด dialog form เพิ่ม/แก้ไขสมาชิก
      isEditing: false,      // แยกโหมดว่าเป็นเพิ่มหรือแก้ไข
      record: { id: "", email: "", password: "", status: "", pic: "" }, // ข้อมูลสมาชิกปัจจุบัน
      dialogFile: null,      // เก็บไฟล์รูปภาพที่เลือกใหม่ (ใน dialog)
    };
  },

  // ฟังก์ชันนี้ทำงานเมื่อ component ถูก mount
  async mounted() {
    const token = localStorage.getItem("token"); // ดึง JWT token จาก localStorage
    if (!token) {
      // ถ้าไม่มี token → ไปหน้า login
      this.$router.push("/login");
      return;
    }

    // โหลดข้อมูลสมาชิกจาก backend
    await this.loadUsers();
  },

  methods: {
    // ===================== โหลดข้อมูลสมาชิก =====================
    async loadUsers() {
      try {
        const token = localStorage.getItem("token"); // ดึง JWT token
        const res = await axios.get("http://localhost:7000/users", {
          headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
        });
        this.users = res.data.rows; // เก็บข้อมูลสมาชิกลง users
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          // token หมดอายุหรือไม่ถูกต้อง → แจ้งผู้ใช้และ logout
          alert("กรุณาเข้าสู่ระบบใหม่");
          this.logout();
        }
      }
    },

    // ===================== เปิด Dialog สำหรับเพิ่มสมาชิก =====================
    addUser() {
      this.isEditing = false; // โหมดเพิ่ม
      this.record = { id: "", email: "", password: "", status: "", pic: "" }; // ล้างข้อมูลเก่า
      this.dialogFile = null; // ล้างไฟล์เก่า
      this.dialog = true;     // เปิด dialog
    },

    // ===================== เปิด Dialog สำหรับแก้ไขสมาชิก =====================
    editUser(user) {
      this.isEditing = true;   // โหมดแก้ไข
      this.record = { ...user }; // clone ข้อมูลสมาชิกที่ต้องการแก้ไข
      this.dialogFile = null;    // ล้างไฟล์ใหม่
      this.dialog = true;        // เปิด dialog
    },

    // ===================== ลบสมาชิก =====================
    async deleteUser(id) {
      if (confirm("คุณต้องการลบผู้ใช้นี้หรือไม่?")) { // ยืนยันก่อนลบ
        const token = localStorage.getItem("token"); // ดึง token
        await axios.delete(`http://localhost:7000/delete-user/${id}`, {
          headers: { Authorization: `Bearer ${token}` }, // ส่ง token
        });
        this.loadUsers(); // รีโหลดข้อมูลหลังลบ
      }
    },

    // ===================== บันทึกสมาชิก (เพิ่ม/แก้ไข) =====================
    async save() {
      const formData = new FormData(); // สร้าง FormData สำหรับส่ง multipart/form-data
      formData.append("email", this.record.email);       // เพิ่ม email
      formData.append("password", this.record.password); // เพิ่ม password
      formData.append("status", this.record.status);     // เพิ่ม status

      // ถ้ามีไฟล์รูปใหม่ → เพิ่มไฟล์
      if (this.dialogFile) formData.append("pic", this.dialogFile);
      // ถ้าแก้ไขและไม่มีไฟล์ใหม่ แต่มีรูปเก่า → ส่งชื่อไฟล์เก่า
      else if (this.record.pic) formData.append("pic", this.record.pic);

      const token = localStorage.getItem("token"); // ดึง token

      // กำหนด URL สำหรับ POST → ขึ้นอยู่กับโหมดเพิ่มหรือแก้ไข
      const url = this.isEditing
        ? `http://localhost:7000/edit-user/${this.record.id}` // แก้ไข
        : "http://localhost:7000/insert";                     // เพิ่ม

      // ส่งข้อมูลไป backend
      await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });

      this.dialog = false;   // ปิด dialog หลังบันทึก
      this.loadUsers();      // รีโหลดข้อมูลสมาชิก
    },

    // ===================== Logout =====================
    logout() {
      localStorage.removeItem("token"); // ลบ token ออกจาก localStorage
      localStorage.removeItem("user");  // ลบข้อมูล user
      this.$router.push("/login");      // ไปหน้า login
    },
  },
};
</script>


<style scoped>
/* Background Image + Gradient Overlay */
.app-background {
  min-height: 100vh;
  background: 
    linear-gradient(rgba(46,26,59,0.7), rgba(75,46,111,0.7)),
    url('https://images.unsplash.com/photo-1672306325342-8373e06baf99?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D') center/cover no-repeat;
  display: flex;
  flex-direction: column;
  transition: all 0.5s;
}

/* Gradient Toolbar + Glow */
.gradient-toolbar {
  background: linear-gradient(90deg, #6a1b9a, #9c27b0, #ab47bc);
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
  transition: all 0.3s;
}
.glow-text {
  text-shadow: 0 0 6px #fff, 0 0 10px #ab47bc;
}

/* Animated Icon */
.animated-icon {
  animation: icon-bounce 1.2s infinite alternate;
}
@keyframes icon-bounce {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}

/* Table Row Hover */
.custom-table tbody tr:hover {
  background: rgba(171, 71, 188, 0.2);
  transition: all 0.3s;
}

/* Avatar Shadow */
.avatar-shadow {
  border: 1px solid #bbb;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Buttons Gradient + Hover */
.gradient-btn-purple {
  background: linear-gradient(90deg, #7b1fa2, #9c27b0);
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: all 0.2s;
}
.gradient-btn-purple:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
}

.gradient-btn-red-purple {
  background: linear-gradient(90deg, #d32f2f, #9c27b0);
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: all 0.2s;
}
.gradient-btn-red-purple:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
}

/* Action Buttons */
.btn-action-purple:hover {
  transform: scale(1.2);
}
.btn-action-red-purple:hover {
  transform: scale(1.2);
}

/* Dialog Shadow */
.dialog-shadow {
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
/* ปุ่ม Dashboard */
.gradient-btn-green {
  background: linear-gradient(90deg, #43a047, #66bb6a);
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: all 0.2s;
}
.gradient-btn-green:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
}
</style>
