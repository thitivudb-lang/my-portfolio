# my-portfolio
# Thitiwut Buphatong — Portfolio

เว็บพอร์ตโฟลิโอส่วนตัวของ ธิติวุฒิ บุผาทอง (นักศึกษาวิศวกรรมคอมพิวเตอร์ สาขา Robot Automation, มหาวิทยาลัยราชภัฏพิบูลสงคราม) แสดงทักษะ ผลงาน ประวัติการศึกษา ใบประกาศนียบัตร และช่องทางติดต่อ

## เทคโนโลยีที่ใช้

| ภาษา / เทคโนโลยี | ใช้ทำอะไร |
|---|---|
| **HTML5** | โครงสร้างหน้าเว็บ ใช้แท็ก semantic เช่น `header`, `nav`, `main`, `section`, `article`, `footer` |
| **CSS3** | สไตล์ทั้งหมด (Grid, Flexbox, CSS Variables, Media Queries, Animation) |
| **JavaScript (Vanilla)** | ระบบโต้ตอบทั้งหมด ไม่ใช้ framework หรือไลบรารีภายนอก |
| **Google Fonts** | ฟอนต์ *Sarabun* (ตัวอักษรหลัก) และ *JetBrains Mono* (ป้ายกำกับ/โค้ด) |
| **FormSubmit.co** | บริการรับฟอร์มติดต่อ ส่งข้อความเข้าอีเมลโดยไม่ต้องมี backend |
| **GitHub Pages** | โฮสต์เว็บไซต์ฟรี |

โปรเจกต์เป็น **ไฟล์เดียว (`index.html`)** รวม HTML, CSS และ JS ไว้ด้วยกัน ไม่ต้อง build ไม่ต้องติดตั้งอะไรเพิ่ม

## ฟีเจอร์และวิธีทำงาน

### ดีไซน์และ UI
- **Dark / Light mode** — สลับธีมด้วยปุ่มบน Navbar ใช้ CSS Variables (`:root` และ `[data-theme="dark"]`) เปลี่ยนค่าสีทั้งหน้า และบันทึกตัวเลือกไว้ใน `localStorage` เพื่อจำธีมครั้งถัดไป
- **Responsive** — รองรับทุกขนาดจอ ใช้ CSS Grid ปรับจำนวนคอลัมน์ที่ breakpoint 980px และ 720px และมีเมนู Hamburger บนมือถือ
- **Sticky Navbar** — แถบเมนูติดด้านบน พื้นหลังเบลอ (`backdrop-filter`) และใช้ `color-mix()` ผสมสีกับธีม
- **Smooth scroll** — เลื่อนไปยังแต่ละส่วนอย่างนุ่มนวลด้วย `scroll-behavior: smooth`

### JavaScript
- **Typing effect** — ข้อความตำแหน่งงานบน Hero พิมพ์และลบสลับกันอัตโนมัติ (`setTimeout` วนลูป)
- **Active nav link** — ใช้ `IntersectionObserver` ตรวจว่าผู้ใช้เลื่อนมาถึงส่วนไหน แล้วไฮไลต์เมนูให้ตรงกัน
- **Image gallery** — การ์ดผลงานมีสไลด์ภาพพร้อมจุดเลือกภาพ (dots) คลิกเพื่อสลับ
- **Scroll-to-top** — ปุ่มกลับขึ้นด้านบนจะปรากฏเมื่อเลื่อนลงเกิน 500px
- **Progress bar animation** — แถบความคืบหน้าเลื่อนขึ้นเมื่อเลื่อนมาเห็น (เตรียมไว้ใช้งานภายหลัง)
- **Contact form** — ส่งข้อมูลด้วย `fetch()` (AJAX) ไปที่ FormSubmit แสดงสถานะ "กำลังส่ง / สำเร็จ / ผิดพลาด" มีช่อง honeypot (`_honey`) ซ่อนไว้ดักสแปมบอท
- **Footer year** — ปีลิขสิทธิ์อัปเดตอัตโนมัติจาก `new Date()`

### การเข้าถึง (Accessibility)
- ใส่ `aria-label` ให้ปุ่มที่เป็นไอคอน และ `alt` ให้รูปภาพ
- แสดงกรอบ focus ชัดเจนเมื่อใช้คีย์บอร์ด (`:focus-visible`)
- ปิดแอนิเมชันอัตโนมัติสำหรับผู้ที่ตั้งค่า `prefers-reduced-motion`

## โครงสร้างหน้าเว็บ

1. **ประวัติ (Hero)** — แนะนำตัว ช่องทางติดต่อ ปุ่มดูผลงาน / ดาวน์โหลด CV
2. **ทักษะ** — Embedded & Hardware, Cloud / IoT / Networking, Programming & AI, Soft Skills
3. **ผลงาน** — AI Study Buddy, Motor Health Monitoring System, FITFORGE
4. **เส้นทางการศึกษา** — Timeline พร้อมการ์ดแสดง GPAX
5. **ใบประกาศนียบัตร** — เกียรติบัตรอบรม IoT, Python Essentials, AI และอื่น ๆ
6. **ภาพรวมผลงาน (Showcase)** — แกลเลอรีภาพของแต่ละโปรเจกต์
7. **ติดต่อ** — ฟอร์มส่งข้อความ

## โครงสร้างไฟล์

```
.
├── index.html        # หน้าเว็บทั้งหมด (HTML + CSS + JS)
├── README.md
└── assets/
    ├── profile.jpg   # รูปโปรไฟล์
    └── cert*.png     # ใบประกาศและภาพผลงาน
```

## ผลงานที่แสดงในเว็บ

- **AI Study Buddy** — ผู้ช่วยการเรียนรู้ด้วย AI สรุปบทเรียน สร้างแฟลชการ์ด/แบบทดสอบ และตอบคำถามจากเอกสารด้วย RAG (Python, Streamlit, Ollama)
- **Motor Health Monitoring System** — ระบบ IoT ตรวจสอบและควบคุมมอเตอร์แบบ real-time (Raspberry Pi, ESP32, Firebase, C++/Python)
- **FITFORGE** — เว็บแอปวางแผนออกกำลังกายส่วนบุคคล (React, JavaScript) — [GitHub](https://github.com/thitivudb-lang/FITFORGE-AI)

## ติดต่อ

- Email: thitivud.b@gmail.com
- GitHub: [thitivudb-lang](https://github.com/thitivudb-lang)
- Instagram: [t.focus_](https://instagram.com/t.focus_)

## License

© Thitiwut Buphatong — ออกแบบและพัฒนาโดยตัวเอง
