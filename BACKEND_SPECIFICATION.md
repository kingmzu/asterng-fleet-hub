# ASTERNG FLEET HUB - BACKEND SPECIFICATION DOCUMENT

## PROJECT OVERVIEW

**Application**: ASTERNG Fleet Hub - Motorcycle Fleet Management System
**Purpose**: A comprehensive system for managing riders, motorcycles, payments (remittances), expenses, and compliance tracking for a logistics/delivery fleet operation.

**Frontend Technology**: React 18.3.1 + TypeScript + Vite + Tailwind CSS
**Backend Required**: Vanilla PHP with REST API
**Database**: MySQL/PostgreSQL (recommended)

---

## 1. CORE DATA MODELS & SCHEMAS

### 1.1 USERS (Admin/Fleet Manager)
```
Field           | Type      | Constraints      | Notes
ID              | UUID      | PRIMARY KEY      | Unique identifier
Email           | VARCHAR   | UNIQUE, NOT NULL | Login credential
Password Hash   | VARCHAR   | NOT NULL         | Bcrypt hashed
Name            | VARCHAR   | NOT NULL         | Full name
Role            | VARCHAR   | DEFAULT 'admin'  | User role/permissions
Created At      | TIMESTAMP | AUTO             | Record creation date
Updated At      | TIMESTAMP | AUTO             | Last modified date
```

### 1.2 RIDERS
```
Field                    | Type      | Constraints      | Notes
ID                       | UUID      | PRIMARY KEY      | Unique rider ID
Name                     | VARCHAR   | NOT NULL         | Full name
Phone                    | VARCHAR   | UNIQUE           | Contact number
Email                    | VARCHAR   | UNIQUE           | Email address
National ID              | VARCHAR   | UNIQUE           | Govt ID number
License Number           | VARCHAR   | UNIQUE           | Driver's license
Photo URL                | VARCHAR   | NULL             | Avatar/profile pic
Status                   | ENUM      | NOT NULL         | active|suspended|pending
Compliance Score         | INT       | DEFAULT 0        | 0-100 score
Assigned Bike ID         | UUID      | FOREIGN KEY      | Reference to motorcycles table
KYC Status               | ENUM      | NOT NULL         | verified|pending|rejected
Police Clearance         | BOOLEAN   | DEFAULT FALSE    | Compliance flag
Test Approved            | BOOLEAN   | DEFAULT FALSE    | Training/test passed
Join Date                | DATE      | NOT NULL         | Onboarding date
Total Remittance         | DECIMAL   | DEFAULT 0        | Lifetime payments made
Outstanding Balance      | DECIMAL   | DEFAULT 0        | Money owed
Created At               | TIMESTAMP | AUTO             | Record creation date
Updated At               | TIMESTAMP | AUTO             | Last modified date
```

### 1.3 MOTORCYCLES
```
Field               | Type      | Constraints      | Notes
ID                  | UUID      | PRIMARY KEY      | Unique bike ID
Registration Number | VARCHAR   | UNIQUE, NOT NULL | License plate
Make                | VARCHAR   | NOT NULL         | Bike manufacturer (Honda, Yamaha, etc)
Model               | VARCHAR   | NOT NULL         | Model name
Year                | INT       | NOT NULL         | Manufacturing year
Color               | VARCHAR   | NULL             | Bike color
Status              | ENUM      | NOT NULL         | active|maintenance|suspended
Assigned Rider ID   | UUID      | FOREIGN KEY      | Reference to riders table
Insurance Expiry    | DATE      | NOT NULL         | Insurance validity date
Last Maintenance    | DATE      | NULL             | Last service date
Total Revenue       | DECIMAL   | DEFAULT 0        | Lifetime earnings from bike
Maintenance Cost    | DECIMAL   | DEFAULT 0        | Total maintenance expenses
Created At          | TIMESTAMP | AUTO             | Record creation date
Updated At          | TIMESTAMP | AUTO             | Last modified date
```

### 1.4 REMITTANCES (Payments/Collections)
```
Field              | Type      | Constraints      | Notes
ID                 | UUID      | PRIMARY KEY      | Unique remittance ID
Rider ID           | UUID      | FOREIGN KEY      | Reference to riders table
Bike ID            | UUID      | FOREIGN KEY      | Reference to motorcycles table
Rider Name         | VARCHAR   | NOT NULL         | Cached name (denormalized)
Amount             | DECIMAL   | NOT NULL         | Payment amount
Date               | DATE      | NOT NULL         | Payment date
Type               | ENUM      | NOT NULL         | daily|weekly (payment frequency)
Status             | ENUM      | NOT NULL         | paid|partial|overdue
Method             | ENUM      | NOT NULL         | cash|transfer|pos (payment method)
Notes              | TEXT      | NULL             | Additional info
Created At         | TIMESTAMP | AUTO             | Record creation date
Updated At         | TIMESTAMP | AUTO             | Last modified date
```

### 1.5 EXPENSES
```
Field              | Type      | Constraints      | Notes
ID                 | UUID      | PRIMARY KEY      | Unique expense ID
Category           | ENUM      | NOT NULL         | maintenance|mechanic|fuel|insurance|pos|capital|other
Description        | VARCHAR   | NOT NULL         | Expense details
Amount             | DECIMAL   | NOT NULL         | Expense amount
Date               | DATE      | NOT NULL         | Expense date
Bike ID            | UUID      | FOREIGN KEY      | Reference to motorcycles table (optional)
Rider Name         | VARCHAR   | NULL             | Associated rider (if applicable)
Receipt URL        | VARCHAR   | NULL             | Document reference
Created At         | TIMESTAMP | AUTO             | Record creation date
Updated At         | TIMESTAMP | AUTO             | Last modified date
```

---

## 2. API ENDPOINTS SPECIFICATION

### 2.1 AUTHENTICATION ENDPOINTS

**POST** `/api/auth/login`
```json
REQUEST:
{
  "email": "admin@asterng.com",
  "password": "securePassword123"
}

RESPONSE (200):
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "admin@asterng.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}

ERROR (401):
{
  "success": false,
  "error": "Invalid email or password"
}
```

**POST** `/api/auth/logout`
```json
REQUEST: (Headers: Authorization: Bearer {token})

RESPONSE (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

**GET** `/api/auth/me`
```json
REQUEST: (Headers: Authorization: Bearer {token})

RESPONSE (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@asterng.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

### 2.2 RIDERS ENDPOINTS

**GET** `/api/riders`
```json
Query Parameters:
- status: active|suspended|pending (optional filter)
- search: search term for name/phone (optional)
- page: page number (default: 1)
- limit: results per page (default: 20)
- sortBy: name|status|compliance_score (default: name)
- order: asc|desc (default: asc)

RESPONSE (200):
{
  "success": true,
  "data": {
    "riders": [
      {
        "id": "uuid",
        "name": "John Doe",
        "phone": "+234812345678",
        "email": "john@example.com",
        "status": "active",
        "complianceScore": 85,
        "assignedBikeId": "bike-uuid",
        "kycStatus": "verified",
        "policeClearance": true,
        "testApproved": true,
        "joinDate": "2024-01-15",
        "totalRemittance": 250000,
        "outstandingBalance": 15000
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

**GET** `/api/riders/:id`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+234812345678",
    "email": "john@example.com",
    "nationalId": "BN123456",
    "licenseNumber": "DL987654",
    "photoUrl": "https://...",
    "status": "active",
    "complianceScore": 85,
    "assignedBikeId": "bike-uuid",
    "kycStatus": "verified",
    "policeClearance": true,
    "testApproved": true,
    "joinDate": "2024-01-15",
    "totalRemittance": 250000,
    "outstandingBalance": 15000,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-02-20T14:22:00Z"
  }
}
```

**POST** `/api/riders`
```json
REQUEST:
{
  "name": "John Doe",
  "phone": "+234812345678",
  "email": "john@example.com",
  "nationalId": "BN123456",
  "licenseNumber": "DL987654",
  "photoUrl": "base64_image_or_url",
  "status": "pending",
  "kycStatus": "pending",
  "policeClearance": false,
  "testApproved": false,
  "joinDate": "2024-01-15"
}

RESPONSE (201):
{
  "success": true,
  "message": "Rider created successfully",
  "data": {
    "id": "new-uuid",
    "name": "John Doe",
    ...
  }
}
```

**PUT** `/api/riders/:id`
```json
REQUEST:
{
  "name": "Jane Doe",
  "phone": "+234812345678",
  "email": "jane@example.com",
  "status": "active",
  "kycStatus": "verified",
  "policeClearance": true,
  "complianceScore": 85
}

RESPONSE (200):
{
  "success": true,
  "message": "Rider updated successfully",
  "data": { ...updated rider }
}
```

**DELETE** `/api/riders/:id`
```json
RESPONSE (200):
{
  "success": true,
  "message": "Rider deleted successfully"
}
```

**PATCH** `/api/riders/:id/status`
```json
REQUEST:
{
  "status": "suspended"
}

RESPONSE (200):
{
  "success": true,
  "message": "Rider status updated",
  "data": { ...rider with new status }
}
```

**GET** `/api/riders/outstanding`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "riders": [
      {
        "id": "uuid",
        "name": "John Doe",
        "outstandingBalance": 15000,
        "assignedBikeId": "bike-uuid"
      }
    ]
  }
}
```

---

### 2.3 MOTORCYCLES ENDPOINTS

**GET** `/api/motorcycles`
```json
Query Parameters:
- status: active|maintenance|suspended (optional)
- search: search term for registration/make (optional)
- page, limit, sortBy, order (same as riders)

RESPONSE (200):
{
  "success": true,
  "data": {
    "motorcycles": [
      {
        "id": "uuid",
        "registrationNumber": "KN12ABC",
        "make": "Honda",
        "model": "CB150X",
        "year": 2023,
        "color": "Black",
        "status": "active",
        "assignedRiderId": "rider-uuid",
        "insuranceExpiry": "2025-12-31",
        "lastMaintenance": "2024-02-20",
        "totalRevenue": 450000,
        "maintenanceCost": 85000
      }
    ],
    "pagination": { ...}
  }
}
```

**GET** `/api/motorcycles/:id`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "registrationNumber": "KN12ABC",
    "make": "Honda",
    "model": "CB150X",
    "year": 2023,
    "color": "Black",
    "status": "active",
    "assignedRiderId": "rider-uuid",
    "assignedRiderName": "John Doe",
    "insuranceExpiry": "2025-12-31",
    "lastMaintenance": "2024-02-20",
    "totalRevenue": 450000,
    "maintenanceCost": 85000,
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-02-20T14:22:00Z"
  }
}
```

**POST** `/api/motorcycles`
```json
REQUEST:
{
  "registrationNumber": "KN12ABC",
  "make": "Honda",
  "model": "CB150X",
  "year": 2023,
  "color": "Black",
  "insuranceExpiry": "2025-12-31"
}

RESPONSE (201):
{
  "success": true,
  "message": "Motorcycle registered successfully",
  "data": { ...new motorcycle }
}
```

**PUT** `/api/motorcycles/:id`
```json
REQUEST: (Same structure as POST)

RESPONSE (200):
{
  "success": true,
  "message": "Motorcycle updated successfully",
  "data": { ...updated motorcycle }
}
```

**DELETE** `/api/motorcycles/:id`
```json
RESPONSE (200):
{
  "success": true,
  "message": "Motorcycle deleted successfully"
}
```

**PATCH** `/api/motorcycles/:id/assign`
```json
REQUEST:
{
  "riderId": "rider-uuid"
}

RESPONSE (200):
{
  "success": true,
  "message": "Rider assigned to motorcycle",
  "data": { ...motorcycle with new assignment }
}
```

**PATCH** `/api/motorcycles/:id/maintenance`
```json
REQUEST:
{
  "lastMaintenance": "2024-02-20"
}

RESPONSE (200):
{
  "success": true,
  "message": "Maintenance record updated",
  "data": { ...updated motorcycle }
}
```

**GET** `/api/motorcycles/maintenance/alerts`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "motorcycles": [
      {
        "id": "uuid",
        "registrationNumber": "KN12ABC",
        "lastMaintenance": "2023-08-20",
        "daysSinceMaintenance": 184
      }
    ]
  }
}
```

**GET** `/api/motorcycles/insurance/alerts`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "motorcycles": [
      {
        "id": "uuid",
        "registrationNumber": "KN12ABC",
        "insuranceExpiry": "2024-06-30",
        "daysUntilExpiry": 121
      }
    ]
  }
}
```

---

### 2.4 REMITTANCES ENDPOINTS

**GET** `/api/remittances`
```json
Query Parameters:
- status: paid|partial|overdue (optional)
- search: rider name (optional)
- from: start date YYYY-MM-DD (optional)
- to: end date YYYY-MM-DD (optional)
- page, limit, sortBy, order

RESPONSE (200):
{
  "success": true,
  "data": {
    "remittances": [
      {
        "id": "uuid",
        "riderId": "rider-uuid",
        "riderName": "John Doe",
        "bikeId": "bike-uuid",
        "amount": 25000,
        "date": "2024-02-20",
        "type": "daily",
        "status": "paid",
        "method": "cash"
      }
    ],
    "pagination": { ...}
  }
}
```

**GET** `/api/remittances/rider/:riderId`
```json
Query Parameters:
- from, to: date range (optional)
- page, limit

RESPONSE (200):
{
  "success": true,
  "data": {
    "remittances": [ ... ],
    "summary": {
      "totalAmount": 250000,
      "paidAmount": 235000,
      "pendingAmount": 15000,
      "overallStatus": "partial"
    }
  }
}
```

**POST** `/api/remittances`
```json
REQUEST:
{
  "riderId": "rider-uuid",
  "bikeId": "bike-uuid",
  "amount": 25000,
  "date": "2024-02-20",
  "type": "daily",
  "method": "cash",
  "status": "paid",
  "notes": "Payment collected"
}

RESPONSE (201):
{
  "success": true,
  "message": "Remittance logged successfully",
  "data": { ...new remittance }
}
```

**PATCH** `/api/remittances/:id/status`
```json
REQUEST:
{
  "status": "paid"
}

RESPONSE (200):
{
  "success": true,
  "message": "Remittance status updated",
  "data": { ...updated remittance }
}
```

**GET** `/api/remittances/stats`
```json
Query Parameters:
- period: daily|weekly|monthly|yearly (default: monthly)
- from, to: date range (optional)

RESPONSE (200):
{
  "success": true,
  "data": {
    "totalCollected": 1250000,
    "totalOverdue": 85000,
    "paymentsToday": 75000,
    "collectionRate": 87.5,
    "byStatus": {
      "paid": 1002500,
      "partial": 162500,
      "overdue": 85000
    }
  }
}
```

**GET** `/api/remittances/overdue`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "overdue": [
      {
        "id": "uuid",
        "riderId": "rider-uuid",
        "riderName": "John Doe",
        "amount": 25000,
        "dueDate": "2024-02-15",
        "daysOverdue": 5
      }
    ]
  }
}
```

**GET** `/api/remittances/export`
```json
Query Parameters:
- format: csv|pdf (default: csv)
- from, to: date range (optional)

RESPONSE (200): File download (CSV/PDF)
```

---

### 2.5 EXPENSES ENDPOINTS

**GET** `/api/expenses`
```json
Query Parameters:
- category: maintenance|mechanic|fuel|insurance|pos|capital|other (optional)
- from, to: date range (optional)
- page, limit, sortBy, order

RESPONSE (200):
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "uuid",
        "category": "maintenance",
        "description": "Engine oil change",
        "amount": 5000,
        "date": "2024-02-20",
        "bikeId": "bike-uuid",
        "riderName": "John Doe"
      }
    ],
    "pagination": { ...}
  }
}
```

**GET** `/api/expenses/category/:category`
```json
Query Parameters:
- from, to: date range (optional)

RESPONSE (200):
{
  "success": true,
  "data": {
    "category": "maintenance",
    "total": 85000,
    "count": 8,
    "expenses": [ ... ]
  }
}
```

**POST** `/api/expenses`
```json
REQUEST:
{
  "category": "maintenance",
  "description": "Engine oil change",
  "amount": 5000,
  "date": "2024-02-20",
  "bikeId": "bike-uuid",
  "receiptUrl": "document_url"
}

RESPONSE (201):
{
  "success": true,
  "message": "Expense added successfully",
  "data": { ...new expense }
}
```

**GET** `/api/expenses/stats`
```json
Query Parameters:
- period: daily|weekly|monthly|yearly (default: monthly)
- from, to: date range (optional)

RESPONSE (200):
{
  "success": true,
  "data": {
    "totalExpenses": 97500,
    "byCategory": {
      "maintenance": 45000,
      "mechanic": 32500,
      "fuel": 20000,
      "insurance": 0,
      "pos": 0,
      "capital": 0,
      "other": 0
    },
    "averagePerCategory": {
      "maintenance": 5625,
      "mechanic": 4062.50
    }
  }
}
```

**GET** `/api/expenses/breakdown`
```json
Query Parameters:
- period: monthly (default)
- from, to: date range

RESPONSE (200):
{
  "success": true,
  "data": {
    "breakdown": [
      {
        "category": "maintenance",
        "total": 45000,
        "percentage": 46.15
      },
      {
        "category": "mechanic",
        "total": 32500,
        "percentage": 33.34
      }
    ]
  }
}
```

**GET** `/api/expenses/export`
```json
Query Parameters:
- format: csv|pdf (default: csv)
- from, to: date range (optional)

RESPONSE (200): File download (CSV/PDF)
```

---

### 2.6 DASHBOARD ENDPOINTS

**GET** `/api/dashboard/stats`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "totalBikes": 6,
    "activeBikes": 5,
    "activeRiders": 4,
    "suspendedRiders": 1,
    "monthlyRevenue": 485000,
    "monthlyExpenses": 97500,
    "netProfit": 387500,
    "overduePayments": 2,
    "collectionRate": 87
  }
}
```

**GET** `/api/dashboard/revenue-trends`
```json
Query Parameters:
- months: number of months (default: 6)

RESPONSE (200):
{
  "success": true,
  "data": [
    {
      "month": "Sep 2024",
      "revenue": 420000,
      "expenses": 85000
    },
    {
      "month": "Oct 2024",
      "revenue": 450000,
      "expenses": 95000
    },
    {
      "month": "Nov 2024",
      "revenue": 485000,
      "expenses": 97500
    }
  ]
}
```

**GET** `/api/dashboard/compliance`
```json
RESPONSE (200):
{
  "success": true,
  "data": {
    "fullCompliant": 2,
    "needsAttention": 2,
    "nonCompliant": 1,
    "averageScore": 74,
    "byRider": [
      {
        "id": "uuid",
        "name": "John Doe",
        "status": "active",
        "kycStatus": "verified",
        "policeClearance": true,
        "complianceScore": 85
      }
    ]
  }
}
```

---

## 3. BUSINESS LOGIC REQUIREMENTS

### 3.1 Compliance Score Calculation
```
Base Score: 50 points

+ 15 points: KYC verified
+ 15 points: Police clearance obtained
+ 15 points: Test approved
+ 5 points: Payment on time (no overdue remittances)

Score Categories:
- >= 80: Fully Compliant (Green)
- 50-79: Needs Attention (Yellow)
- < 50: Non-Compliant (Red)
```

### 3.2 Outstanding Balance Calculation
```
Outstanding = Total Remittances Due - Total Amounts Paid
Auto-update when:
- New remittance created
- Payment status changed
- Rider record updated
```

### 3.3 Status Transitions
```
RIDERS:
pending → active (when KYC + test approved)
active → suspended (admin action or compliance failure)
suspended → active (compliance restoration)

MOTORCYCLES:
active → maintenance (manual, date recorded)
maintenance → active (when last_maintenance updated)
active → suspended (admin action)

REMITTANCES:
pending → paid/partial (payment logged)
partial → paid (full payment received)
Any → overdue (if date > today and not paid)
```

### 3.4 Automatic Alerts
```
- Insurance expiry: Alert if expires within 30 days
- Maintenance due: Alert if > 180 days since last maintenance
- Overdue payments: Flag remittance as overdue if due date has passed
- Compliance risk: Flag rider if score drops below 60
```

---

## 4. TECHNICAL REQUIREMENTS FOR PHP BACKEND

### 4.1 API Best Practices
- RESTful architecture
- JSON request/response format
- Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Standard error response format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### 4.2 Security
- JWT token authentication
- CORS enabled for React frontend
- Input validation on all endpoints
- SQL injection prevention (prepared statements)
- Password hashing (bcrypt)
- Rate limiting
- Request validation & sanitization

### 4.3 Database
- Support transactions for financial operations
- Proper indexing on frequently queried columns (status, dates, rider/bike IDs)
- Soft deletes recommended for audit trail
- Timestamps (created_at, updated_at) on all tables

### 4.4 File Uploads
- Support image uploads for rider photos
- Support receipt uploads for expenses
- Store in S3/cloud or local with secure path
- Return secure URLs in API responses

### 4.5 Export Functionality
- CSV export for remittances and expenses
- PDF export (optional but desirable)
- Include filters applied when exporting

### 4.6 Pagination & Performance
- Implement offset-limit pagination
- Max limit: 100 items per page
- Default limit: 20 items per page
- Return total count for pagination

---

## 5. DATABASE SCHEMA SUMMARY

```sql
-- Core Tables
users
riders
motorcycles
remittances
expenses

-- Optional Supporting Tables
compliance_logs (track score changes)
payment_logs (audit trail for finances)
maintenance_logs (bike service history)
insurance_logs (policy tracking)
```

---

## 6. FRONTEND-BACKEND INTEGRATION NOTES

**Current State**: Frontend uses mock data from `mockData.ts`

**Integration Steps**:
1. Replace mock API calls with HTTP requests to above endpoints
2. Update API base URL via environment variable
3. Add token management (store JWT in localStorage/sessionStorage)
4. Implement error handling and retry logic
5. Add loading states using skeleton components
6. Fetch fresh data on page load and after mutations

**Environment Configuration**:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=ASTERNG Fleet Hub
```

---

## Summary

This specification provides everything a vanilla PHP developer needs to create the backend for ASTERNG Fleet Hub. All endpoints, data models, and business logic are clearly defined and aligned with the frontend mockup.
