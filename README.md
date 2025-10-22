# 🏢 Flat Broker - Full Stack Real Estate Management System

A **complete full-stack real estate platform** for managing flat listings, built using
**React.js**, **Node.js**, **Express**, **Prisma**, and **PostgreSQL**. The project 
features **role-based access** for users (buyers/sellers) and admins, with image uploads, 
enquiries, approval workflows, and dashboards.

---

## 🚀 Features

### 🔐 Authentication & Authorization

- JWT-based secure login
- Role-based dashboards:
  - **Buyer/Seller**: Submit, view, and manage flats
  - **Admin**: Approve/reject flats, view sold flats, manage enquiries

### 🏘️ Flat Management

- Add new flat listings with **multiple images**
- View approved or pending flats
- Admin can approve, reject, or mark flats as sold

### 💬 Enquiry System

- Buyers can send enquiries for approved flats
- Sellers receive and manage enquiries
- Admin can view all enquiries across the platform

### 📸 Image Uploads

- Multiple image upload support via **Multer**
- Images linked to flat records
- Stored locally or can be connected to cloud storage

### 💻 Frontend UI

- Built with **React + Vite**
- **Tailwind CSS** for styling (optional)
- Clean, dashboard-based layout using **React Router (v6+)**
- Fully responsive design

---

## 🛠️ Tech Stack

| Frontend           | Backend             | Database      |
|--------------------|---------------------|---------------|
| React.js (Vite)    | Node.js + Express   | PostgreSQL    |
| React Router v6    | Prisma ORM          | Prisma Client |
| Axios              | JWT + Bcrypt        |               |
| Tailwind CSS       | Multer (Image Uploads)|             |

---

## 📦 Folder Structure

```

flat-broker-app/
├── flat-broker/               # React frontend
│   └── src/
│       └── components/
│       └── pages/
│       └── api/
│       └── App.jsx
│       └── .env
│       └── main.jsx
│
├── flat-broker-backend/       # Node.js backend
│   └── controllers/
│   └── routes/
│   └── models/ (via Prisma)
│   └── middlewares/
│   └── .env
│   └── uploads/
│   └── server.js
│   └── prisma/
│         └── schema.prisma


````

---

## ⚙️ Setup Instructions

### 1️⃣ Backend (Express + Prisma + PostgreSQL)

```bash
cd server

# Install dependencies
npm install

# Setup .env
cp .env.example .env

# Setup DB with Prisma
npx prisma migrate dev --name init

# Start server
npm run dev
````

> Ensure PostgreSQL is running and your database URL is correctly configured in `.env`.

---

### 2️⃣ Frontend (React + Vite)

```bash
cd client

# Install dependencies
npm install

# Setup .env
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api

# Start frontend
npm run dev
```

> The React app will start at `http://localhost:5173`

---

## 📸 Image Upload Details

* Supports up to **5 images per flat**
* Images are stored in the `/uploads` directory on the backend
* File validation included (max size: 5MB per file)

---

## 🔐 Authentication Flow

* JWT token saved in `localStorage`
* Role (Admin / Buyer / Seller) also saved in `localStorage`
* Protected routes using role-based access
* Auto-redirect based on role after login

---

## 📊 Dashboards

### Admin Panel

* `/admin-dash`
* View & manage:

  * Pending Flats
  * Approved Flats
  * Sold Flats
  * All Enquiries

### User Panel

* `/user-dash`
* Add new flats
* View approved flats
* Enquire about other listings
* Manage enquiries for own flats

---

## 🧪 Sample Admin Credentials

> You may hardcode or seed an admin account initially for testing

```bash
email: admin@flatbroker.com
password: admin123
```

---

## 🧠 Learning Outcomes

* Real-world **CRUD application** development
* Image uploading with **Multer**
* Auth system with **JWT & Bcrypt**
* Prisma ORM & PostgreSQL integration
* **Role-based routing** and access control
* **React Dashboards** with dynamic routing
* Environment-based configuration handling

---

## 📄 License

This project is open source and available under the **MIT License**.

---

## 📬 Find here, in case deployed live
- https://flat-broker.vercel.app
