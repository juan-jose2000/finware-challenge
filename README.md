# Finware Challenge - Investment Platform API

A comprehensive fintech investment platform built with NestJS, TypeORM, and PostgreSQL, featuring AI-powered market analysis using Ollama.

This README includes:
- Complete setup instructions
- All API endpoints with examples
- Ollama model setup instructions
- Testing guidance
- Project structure overview
- Troubleshooting section
- Business logic explanations

## Technologies Used

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **AI**: Ollama (Local LLM - phi:latest)
- **Containerization**: Docker + Docker Compose
- **Testing**: Jest + Supertest
- **Validation**: class-validator
- **Password Hashing**: bcrypt

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and add tests
3. Run tests: `npm run test`
4. Commit changes: `git commit -m "Add your feature"`
5. Push to branch: `git push -u origin feature/your-feature`
6. Create a Pull Request

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Investment Opportunities**: Create and manage investment opportunities ($40K-$600K range)
- **AI Market Analysis**: Automatic market analysis generation using Ollama LLM
- **Investment Transactions**: Secure investment creation with ACID compliance and concurrency control
- **Database**: PostgreSQL with TypeORM for robust data management
- **Containerized**: Full Docker setup for development and production

## Prerequisites

- Docker Desktop (with at least 4GB RAM allocated)
- Docker Compose
- Git

## Installation & Setup

### 1. Clone the Repository
git clone https://github.com/juan-jose2000/finware-challenge.git
cd finware-challenge

### 2. Environment Setup
The application uses Docker Compose for containerized development. All environment variables are configured in `docker-compose.yml`.

### 3. Build and Start Services
### Build and start all services (API, PostgreSQL, Ollama)
docker-compose up -d

### 4. Setup Ollama AI Model ---- Important #####################################################

**Important**: The AI market analysis feature requires a specific Ollama model to be downloaded.

### Access the Ollama container
docker-compose exec ollama bash

### Pull the required model for AI market analysis (I used phi:latest) 
#### if you want to modify for other version, see -> Common Issues - step 1. **Ollama Model** on this documentation
ollama pull phi:latest

### Exit the container
exit

## docker containers running in

The API runs on `http://localhost:4000`
DB runs on `http://localhost:5432`
Ollama runs on `http://localhost:11434`

## API Endpoints

### Authentication Endpoints

#### Register User
POST /auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "birthDate": "1990-01-01",
  "password": "securepassword123"
}

**Response:**
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "birthDate": "1990-01-01",
    "balance": 1000.00
  }
}

#### Login User
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

**Response:**
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "birthDate": "1990-01-01",
    "balance": 1000.00
  }
}

### Investment Opportunities Endpoints
**All endpoints require JWT authentication** (include `Authorization: Bearer <token>` header)

#### Create Opportunity
POST /opportunities
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tech Startup Investment",
  "totalAmount": 150000,
  "details": "Promising fintech startup with innovative payment solutions"
}

#### Get All Opportunities
GET /opportunities
Authorization: Bearer <token>

#### Get Specific Opportunity
GET /opportunities/{id}
Authorization: Bearer <token>

#### Update Opportunity
PATCH /opportunities/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Tech Startup",
  "totalAmount": 200000,
  "details": "Updated description"
}

#### Delete Opportunity
DELETE /opportunities/{id}
Authorization: Bearer <token>

### Investment Endpoints
**All endpoints require JWT authentication**

#### Create Investment
POST /invest
Authorization: Bearer <token>
Content-Type: application/json

{
  "opportunityId": 1,
  "amount": 500
}

**Business Rules:**
- Minimum investment: $1 MXN
- Must not exceed opportunity total amount
- User must have sufficient balance
- Uses pessimistic locking to prevent overdrafts

#### Get User Investments
GET /invest
Authorization: Bearer <token>

#### Get User Balance
GET /invest/balance
Authorization: Bearer <token>

**Response:**
{
  "balance": 500.00,
  "totalInvested": 500.00
}

#### Get Specific Investment
GET /invest/{id}
Authorization: Bearer <token>

## Testing

### Unit Tests
### Run all unit tests
npm run test

### Run all unit tests for opportunities module
npm run test -- src/auth/__tests__/

### Run all unit tests for opportunities module
npm run test -- src/opportunities/__tests__/

### Run all unit tests for opportunities module
npm run test -- src/investments/__tests__/

### Test Database
Integration tests use a separate `finware_test` database to avoid affecting production data.

### Project Structure

```
src/
├── app.module.ts                 # Root application module
├── main.ts                       # Application entry point
├── auth/                         # Authentication module
│   ├── __test__
│   ├── auth.module.ts
│   ├── controllers/auth.controller.ts
│   ├── services/auth.service.ts
│   ├── entities/user.entity.ts
│   ├── dto/auth-response.dto.ts
|   ├── dto/login.dto.ts
|   ├── dto/register.dto.ts
│   └── strategies/jwt.strategy.ts
├── opportunities/                # Investment opportunities module
│   ├── __test__
│   ├── opportunities.module.ts
│   ├── controllers/opportunities.controller.ts
│   ├── services/ollama.service.ts
│   ├── services/opportunities.service.ts
│   ├── entities/opportunity.entity.ts
│   ├── dto/create-oportunity.dto.ts
│   ├── dto/opportunity-response.dto.ts
│   └── dto/update-oportunity.dto.ts
├── investments/                  # Investment transactions module
│   ├── __test__
│   ├── investments.module.ts
│   ├── controllers/investments.controller.ts
│   ├── services/investments.service.ts
│   ├── entities/investment.entity.ts
│   ├── dto/create-investment.dto.ts
│   ├── dto/invest.dto.ts
│   └── dto/investment.dto.ts
├── common/                       # Shared utilities
│   ├── decorators/jwt-auth.decorator.ts
│   ├── decorators/user.decorator.ts
│   └── guards/jwt-auth.guards.ts
└── test/                         # Test configuration
    └── test.module.ts
```

## Security Features

- **JWT Authentication**: Stateless authentication with configurable expiration
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Input Validation**: Comprehensive DTOs with class-validator
- **Concurrency Control**: Pessimistic locking prevents race conditions during investments
- **SQL Injection Protection**: TypeORM parameterized queries

## Business Logic

### User Registration
- Initial balance: $1,000 MXN
- Password requirements: Minimum 6 characters
- Email validation and uniqueness

### Investment Rules
- Amount range: $1 - $600,000 MXN
- Cannot exceed opportunity total amount
- Atomic transactions with balance validation
- Prevents overdrafts through database locking

### AI Market Analysis
- Asynchronous processing using Event Emitters
- Queued requests to handle Ollama latency
- Automatic retry on failure
- Background processing doesn't block API responses

#### Technical Implementation Details
**Processing Timeout**: AI analysis requests have a **5-minute timeout** (300,000ms) to handle Ollama's processing time, ensuring the system doesn't hang on slow AI responses.

**AI Model**: Uses **`phi:latest`** model - a lightweight, efficient language model optimized for fast inference while maintaining quality financial analysis output.

**Analysis Prompt --- very important**: The AI receives a structured prompt asking for professional market analysis: *"As a financial analyst, provide a brief market analysis for investing $[amount] MXN in "[name]". Consider fintech market trends, potential growth, and general investment viability. Keep your response professional and concise. max in 2-3 sentences"*

These technical specifications ensure reliable, fast, and high-quality AI-generated market analysis for investment opportunities.

## Database Schema

### Users Table
- id, fullName, email, birthDate, password, balance, createdAt, updatedAt

### Opportunities Table
- id, name, totalAmount, details, marketAnalysis, createdAt, updatedAt

### Investments Table
- id, userId, opportunityId, investmentAmount, status, balanceBefore, balanceAfter, notes, createdAt, updatedAt

## Troubleshooting

### Common Issues

1. **Ollama Model**
   - Use phi:latest, if is necessary, grow this model on -> src/opportunities/services/ollama.service.ts ---- model: 'phi:latest', // or whatever model installed

2. **Ollama API Timeout**
   - Use 300,000 miliseconds for response (5 min), if is necessary, grow this time. -> src/opportunities/services/ollama.service.ts ---- timeout: 300000


3. **Ollama API promp**
   - If is needed, prompt can be modify on -> src/opportunities/services/ollama.service.ts
    initial prompt
    const prompt = `As a financial analyst, provide a brief market analysis for investing $${amount.toLocaleString()} MXN in "${name}". Consider fintech market trends, potential growth, and general investment viability. Keep your response professional and concise. max in 2-3 sentences`;

4. **Database Connection Failed**
   - Ensure PostgreSQL container is running: `docker-compose ps`
   - Check logs: `docker-compose logs db`

5. **AI Analysis Not Working**
   - Verify Ollama model is downloaded: `docker-compose exec ollama ollama list`
   - Check Ollama logs: `docker-compose logs ollama`

6. **Tests Failing**
   - Create test database: `docker-compose exec db createdb finware_test`
   - Ensure all containers are running

## License
This project is part of the Finware Challenge assessment.