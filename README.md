# Dewajumart — Multi-Vendor E-Commerce API

> A production-grade multi-vendor marketplace backend built with NestJS microservices. Sellers list products, buyers place orders, and Paystack processes payments — all coordinated through Kafka events and real-time WebSocket notifications.

---

## What Is Dewajumart?

Dewajumart is the backend engine for a Nigerian-focused e-commerce marketplace similar to Jumia. It is not a demo or tutorial project — it is a fully functioning backend system with real payment processing, real-time notifications, background job queues, and independent microservices communicating through Kafka.

Every architectural decision was made to reflect how real production systems work at scale.

---

## Architecture

Dewajumart is built as a **microservices monorepo** using the NestJS CLI. Each service is an independent NestJS application with its own database, its own Kafka consumer group, and its own port. Services never query each other's databases directly — they communicate exclusively through Kafka events or HTTP via the gateway.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│              (Postman / Web / Mobile)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GATEWAY  :3000                           │
│         JWT validation · Rate limiting · Routing            │
│              Swagger docs · Response shaping                │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────┘
   │ HTTP     │ HTTP     │ HTTP     │ HTTP     │ HTTP
   ▼          ▼          ▼          ▼          ▼
 AUTH       PRODUCT    ORDER     PAYMENT   NOTIFICATION
 :3001      :3002      :3003     :3004      :3005
   │          │          │          │          │
   └──────────┴──────────┴──────────┴──────────┘
                         │
                    KAFKA BROKER
                         │
              ┌──────────┴──────────┐
           REDIS                POSTGRES
        (cache · OTP)       (per-service DB)
```

---

## Services

| Service | Port | Responsibility |
|---|---|---|
| **gateway** | 3000 | Public entry point. JWT auth, rate limiting, Swagger, HTTP proxying |
| **auth-service** | 3001 | Registration, login, JWT, refresh tokens, Google OAuth, RBAC |
| **product-service** | 3002 | Product CRUD, categories, image upload, stock management |
| **order-service** | 3003 | Order creation (transactional), state machine, order history |
| **payment-service** | 3004 | Paystack integration, webhook handling, BullMQ verification queue |
| **notification-service** | 3005 | Email + real-time WebSocket alerts for all key events |
| **media-service** | 3006 | Cloudinary image upload, media storage |

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL via TypeORM |
| Message Broker | Apache Kafka (KafkaJS) |
| Cache & Sessions | Redis |
| Payment | Paystack |
| Background Jobs | BullMQ |
| File Storage | Cloudinary |
| Email | Nodemailer + EJS templates |
| Real-time | Socket.io (WebSocket) |
| Auth | JWT + Passport (Local + Google OAuth 2.0) |
| Containerisation | Docker + Docker Compose |
| API Docs | Swagger (OpenAPI) |

---

## Key Features

### Authentication & Security
- Email registration with OTP verification
- Google OAuth 2.0 sign-in
- JWT access tokens with refresh token rotation
- Token-version-based logout (no Redis blacklist needed)
- Role-based access control: `buyer`, `seller`, `admin`
- Forgot password and reset via OTP
- Rate limiting on sensitive endpoints (ThrottlerGuard)

### Product & Category Management
- Seller-only product creation with multipart image upload
- Self-referential category tree (Electronics > Phones > Android)
- Soft delete on products
- Async image upload via Kafka → media-service → Cloudinary
- Product stock management

### Orders
- Atomic order creation using TypeORM `QueryRunner` transactions
- Order status state machine with enforced transitions
- Multi-item orders with price snapshotting at time of order
- Order cancellation with state validation

### Payments
- Paystack transaction initialisation on order creation
- HMAC-SHA512 webhook signature verification
- BullMQ background queue for reliable payment verification
- Idempotency protection using Redis (no duplicate processing)
- Automatic Kafka event emission on payment confirmed or failed

### Real-Time Notifications
- WebSocket gateway with JWT authentication on connect
- Users joined to personal rooms (`user:{userId}`)
- Real-time push on: order created, payment confirmed, payment failed
- Email notifications via EJS templates for all key events
- Kafka fan-out: one event triggers both email and WebSocket simultaneously

---

## Event Flow

```
PLACE ORDER
───────────────────────────────────────────────────────────────
Buyer → POST /orders
  order-service: saves order + items atomically (QueryRunner)
  order-service: emits ORDER_CREATED (Kafka)

  payment-service: receives ORDER_CREATED
    → initialises Paystack transaction
    → saves Payment record (PENDING)
    → emits PAYMENT_INITIATED (Kafka)

  notification-service: receives PAYMENT_INITIATED
    → sends email with payment link
    → pushes WebSocket: "payment:initiated"

COMPLETE PAYMENT
───────────────────────────────────────────────────────────────
Buyer pays on Paystack checkout page

  Paystack → POST /webhook/paystack (payment-service)
    → verifies HMAC signature
    → adds job to BullMQ queue (responds instantly to Paystack)

  BullMQ worker:
    → calls Paystack verify API
    → updates Payment to SUCCESS
    → emits PAYMENT_CONFIRMED (Kafka)

  order-service: receives PAYMENT_CONFIRMED
    → transitions order status to PAYMENT_CONFIRMED

  notification-service: receives PAYMENT_CONFIRMED
    → sends confirmation email
    → pushes WebSocket: "payment:confirmed"
```

---

## Project Structure

```
Dewajumart/
├── apps/
│   ├── gateway/
│   ├── auth-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── notification-service/
│   └── media-service/
├── libs/
│   ├── kafka/          ← shared KafkaModule + topic constants
│   ├── database/       ← shared TypeORM DatabaseModule
│   ├── shared/         ← guards, decorators, interceptors, constants
│   └── bootstrap.util  ← shared app bootstrap (Swagger, pipes, interceptors)
├── docker-compose.yml
└── nest-cli.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker + Docker Compose
- A Paystack account (test keys work)
- A Cloudinary account (free tier works)
- A Google Cloud Console project (for OAuth)

### 1. Clone the repository

```bash
git clone https://github.com/tunde-good-codes/dewaju-mart.git
cd dewajumart
npm install
```
### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in the values:

```env
# Database (one per service)
AUTH_DB_URL=postgresql://postgres:postgres@localhost:5432/auth_service_dev
PRODUCT_DB_URL=postgresql://postgres:postgres@localhost:5432/product_service_dev
ORDER_DB_URL=postgresql://postgres:postgres@localhost:5432/order_service_dev
PAYMENT_DB_URL=postgresql://postgres:postgres@localhost:5432/payment_service_dev

# Kafka
KAFKA_BROKER=localhost:9092

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=150m
JWT_REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_BASE_URL=https://api.paystack.co

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Mailtrap or SMTP)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
```

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, Kafka, and Zookeeper.

### 4. Start all services

```bash
# Each in a separate terminal
npm run start:dev gateway
npm run start:dev auth-service
npm run start:dev product-service
npm run start:dev order-service
npm run start:dev payment-service
npm run start:dev notification-service
npm run start:dev media-service
```

### 5. Access the API

```
Gateway API:    http://localhost:3000/api/v1
Swagger Docs:   http://localhost:3000/api/v1/docs
```

---

## API Overview

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register buyer account (OTP sent to email) |
| POST | `/auth/verify` | Verify OTP and activate account |
| POST | `/auth/login` | Login and receive access + refresh tokens |
| GET | `/auth/google` | Initiate Google OAuth |
| POST | `/auth/refresh-token` | Rotate refresh token |
| POST | `/auth/logout` | Invalidate session |
| POST | `/auth/forgot-password` | Request password reset OTP |
| POST | `/auth/reset-password` | Reset password with OTP |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List all products (public) |
| GET | `/products/:id` | Single product |
| POST | `/products` | Create product — seller only |
| PATCH | `/products/:id` | Update product — seller only |
| DELETE | `/products/:id` | Soft delete — seller or admin |
| GET | `/categories` | Category tree (public) |
| POST | `/categories` | Create category — admin only |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Place an order — buyer only |
| GET | `/orders` | My orders |
| GET | `/orders/:id` | Single order with items |
| PATCH | `/orders/:id/cancel` | Cancel order |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/webhook` | Paystack webhook (no auth) |

---

## Concepts Demonstrated

This project was built specifically to demonstrate the following backend engineering concepts:

| Concept | Implementation |
|---|---|
| **Microservices architecture** | 7 independent NestJS services with clear boundaries |
| **Event-driven design** | Kafka topics for all cross-service communication |
| **Database transactions** | QueryRunner for atomic order creation with rollback |
| **State machines** | Order status transitions enforced in service layer |
| **Background job queues** | BullMQ with exponential backoff retry for payment verification |
| **Webhook security** | HMAC-SHA512 signature verification on Paystack webhooks |
| **Payment integration** | Full Paystack checkout flow with server-side verification |
| **Real-time communication** | Socket.io WebSocket with JWT auth and user rooms |
| **OAuth 2.0** | Google sign-in with Passport strategy |
| **RBAC** | Role-based guards with custom decorators |
| **Redis caching** | OTP storage, idempotency keys, token management |
| **Async file upload** | Kafka-driven Cloudinary upload with event callback |
| **API documentation** | Swagger with reusable decorator helpers |
| **Rate limiting** | ThrottlerGuard on sensitive auth endpoints |
| **Idempotency** | Redis-based duplicate event protection |

---

## Kafka Topics

| Topic | Emitted By | Consumed By | Purpose |
|---|---|---|---|
| `order.created` | order-service | payment, notification | Trigger payment initialisation |
| `payment.initiated` | payment-service | notification | Send payment link to buyer |
| `payment.confirmed` | payment-service | order, notification | Confirm order, notify buyer |
| `payment.failed` | payment-service | order, notification | Cancel order, notify buyer |
| `user.created` | auth-service | notification | Send welcome email |
| `google.user.created` | auth-service | notification | Send Google welcome email |
| `register.user.otp` | auth-service | notification | Send OTP email |
| `forgot.password.otp` | auth-service | notification | Send reset OTP email |

---

## Author

Built by **Tunde Fadipe** as a  project demonstrating production-grade NestJS microservices architecture.

- GitHub: [@tunde-good-codes](https://github.com/tunde-good-codes)


---

## License

MIT
