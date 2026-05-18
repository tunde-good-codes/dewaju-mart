
---

# 📘 **NestJS Stationary and Blog API – Production Ready Endpoints**

A fully-featured, production-grade **Blog API** built with **NestJS**, following clean architecture, modular design, and enterprise backend best practices.

---

## 🚀 **Features**

### 🧩 Core Features

* User registration, login & logout
* JWT Authentication (Access + Refresh Tokens)
* Password hashing using **bcrypt**
* Role-based Authorization (Admin/User)
* Blog Posts CRUD (Create, Read, Update, Delete)
* Comment system (if implemented)
* Pagination, filtering, search

### 📦 File Uploads & Media

* Image uploads using **Multer**
* Media storage via **Cloudinary**
* Automatic MIME/type filtering
* Secure URL return and metadata

### 📧 Email System

* Integrated email service using **Mailtrap** (via SMTP)
* EJS templating (`welcome.ejs`)
* Resend welcome email on registration
* Configurable template directory via Nest CLI asset bundling

### 🗄️ Database & Persistence

This project is designed to work with multiple databases:

* **PostgreSQL** via TypeORM
* **MongoDB** capability (if modules included)
* **Optional Prisma support** included in dependencies
* Entity & Schema validation via class-validator

### 🧰 Utilities & Best Practices

* DTO Validation (class-validator + class-transformer)
* Global pipes and interceptors
* Custom exceptions & filters
* Rate limiting ready (Nest Throttler)
* Config module with `.env` validation using Joi

### 🧪 Testing

* Unit Tests (Jest)
* e2e Tests (Supertest)
* Test watchers and full coverage reporting

### 📚 API Documentation

* Complete **Swagger documentation**
* Auto-generated API schemas from DTOs

---

## 🛠️ **Tech Stack**

| Category          | Technology                            |
| ----------------- | ------------------------------------- |
| Backend Framework | **NestJS**                            |
| Language          | **TypeScript**                        |
| Authentication    | Passport + JWT                        |
| ORM               | TypeORM / Prisma (optional)           |
| Database          | PostgreSQL / MongoDB                  |
| Media Storage     | Cloudinary                            |
| File Uploads      | Multer (+ cloudinary storage)         |
| Email             | @nestjs-modules/mailer, EJS, Mailtrap |
| Tests             | Jest, Supertest                       |
| Dev Tools         | ESLint, Prettier, Compodoc            |

---

# 📂 **Project Structure**

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   └── guards/
│
├── user/
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.entity.ts
│
├── post/
│   ├── post.controller.ts
│   ├── post.service.ts
│   └── post.entity.ts
│
├── mail/
│   ├── providers/
│   │   └── mail.service.ts
│   └── templates/
│       └── welcome.ejs
│
├── common/
│   ├── dto/
│   ├── exceptions/
│   ├── guards/
│   ├── interceptors/
│   └── filters/
│
├── config/
│   ├── app.config.ts
│   ├── mail.config.ts
│   └── cloudinary.config.ts
│
├── main.ts
└── app.module.ts
```

---

# ⚙️ **Installation & Setup**

### 👉 1. Clone the repository

```bash
git clone https://github.com/tunde-good-codes/stationary-and-blog-api.git
cd blog-api-nestjs
```

### 👉 2. Install dependencies

```bash
npm install
```

### 👉 3. Create environment file

Create `.env` at the project root:

```
# App
PORT=3000
NODE_ENV=development


# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Mailtrap SMTP
MAIL_HOST=smtp.mailtrap.io
MAIL_USER=your_user
MAIL_PASS=your_pass
```

---

# 🗃️ **Running the App**

### Development

```bash
npm run start:dev
```

### Production build

```bash
npm run build
npm run start:prod
```

### Testing

```bash
npm run test
npm run test:e2e
npm run test:cov
```

---

# 📑 **API Documentation (Swagger)**

Once the app is running:

➡️ **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

Generated automatically from your DTOs, controllers, and decorators.

---

# 📧 **Email Templates (EJS)**

Your EJS templates are located at:

```
src/mail/templates/welcome.ejs
```

And bundled to:

```
dist/mail/templates/welcome.ejs
```

---

# 🧩 **Scripts You Should Know**

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run start:dev` | Start dev server with watch mode         |
| `npm run build`     | Compile project                          |
| `npm run lint`      | Lint & auto-fix                          |
| `npm run test`      | Run unit tests                           |
| `npm run test:e2e`  | End-to-end tests                         |
| `npm run test:cov`  | Coverage report                          |
| `npm run doc`       | Auto-generate documentation via Compodoc |

---

# 🙌 **Author**

**Tunde Fadipe**
Frontend & Backend Engineer (NestJS, TypeScript, React, Next.js)

---

# 📄 **License**

UNLICENSED – for personal learning and portfolio use.

---

