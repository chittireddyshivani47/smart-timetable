# 📅 Smart Timetable Generator

A full-stack web application for colleges and universities to automatically generate optimized timetables using **Constraint Satisfaction Problem (CSP)** with **Backtracking algorithm**.

---

## 🏗️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React.js 18, Tailwind CSS           |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose                  |
| Algorithm  | CSP with Backtracking + MRV + LCV  |
| Auth       | JWT (JSON Web Tokens)               |
| Export     | jsPDF (PDF), SheetJS (Excel)        |

---

## 📁 Folder Structure

```
smart-timetable/
├── backend/
│   ├── models/
│   │   ├── User.js          # Admin user model
│   │   ├── Subject.js       # Course subjects
│   │   ├── Faculty.js       # Teaching staff
│   │   ├── Classroom.js     # Rooms & labs
│   │   └── Timetable.js     # Generated timetables
│   ├── routes/
│   │   ├── auth.js          # Login / Register
│   │   ├── subjects.js      # Subject CRUD
│   │   ├── faculty.js       # Faculty CRUD
│   │   ├── classrooms.js    # Classroom CRUD
│   │   ├── timetables.js    # Timetable CRUD + generate
│   │   ├── config.js        # Default config
│   │   └── upload.js        # CSV import
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── utils/
│   │   ├── cspAlgorithm.js  # CSP Backtracking engine
│   │   └── seed.js          # Sample data seeder
│   ├── .env.example
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── DashboardPage.js
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── SubjectsPage.js
        │   ├── FacultyPage.js
        │   ├── ClassroomsPage.js
        │   ├── GeneratePage.js        # 4-step wizard
        │   ├── TimetablePage.js       # Grid view + edit
        │   └── TimetableListPage.js
        ├── components/common/
        │   └── Layout.js              # Sidebar layout
        ├── context/
        │   └── AuthContext.js
        └── utils/
            ├── api.js                 # Axios instance
            └── exportUtils.js        # PDF + Excel export
```

---

## 🚀 Setup Instructions (VS Code)

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally (or MongoDB Atlas URI)
- VS Code with REST Client extension (optional)

---

### Step 1: Clone / Extract Project

```bash
cd smart-timetable
```

---

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET

# Optional: Seed demo data
npm run seed
# Creates: admin@college.edu / admin123 + sample subjects, faculty, rooms

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

---

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start React dev server
npm start
# Opens http://localhost:3000
```

---

### Step 4: Login

- Open **http://localhost:3000**
- Login: `admin@college.edu` / `admin123` (after seeding)
- Or register a new account

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | /api/auth/register   | Create admin account|
| POST   | /api/auth/login      | Login + get JWT    |
| GET    | /api/auth/me         | Get current user   |

### Subjects
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/subjects        | List all subjects   |
| POST   | /api/subjects        | Create subject      |
| PUT    | /api/subjects/:id    | Update subject      |
| DELETE | /api/subjects/:id    | Delete subject      |

### Faculty
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/faculty         | List all faculty    |
| POST   | /api/faculty         | Add faculty member  |
| PUT    | /api/faculty/:id     | Update faculty      |
| DELETE | /api/faculty/:id     | Delete faculty      |

### Classrooms
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/classrooms      | List classrooms     |
| POST   | /api/classrooms      | Add classroom       |
| PUT    | /api/classrooms/:id  | Update classroom    |
| DELETE | /api/classrooms/:id  | Delete classroom    |

### Timetables
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/timetables             | List all timetables      |
| GET    | /api/timetables/:id         | Get timetable (populated)|
| POST   | /api/timetables/generate    | **Generate timetable**   |
| PUT    | /api/timetables/:id         | Update timetable         |
| PATCH  | /api/timetables/:id/slot    | Edit single slot         |
| DELETE | /api/timetables/:id         | Delete timetable         |

### Upload (CSV Import)
| Method | Endpoint                        | Description             |
|--------|---------------------------------|-------------------------|
| POST   | /api/upload/subjects            | Import subjects CSV     |
| POST   | /api/upload/faculty             | Import faculty CSV      |
| GET    | /api/upload/sample/:type        | Download sample CSV     |

---

## 🧠 Algorithm Details

### CSP with Backtracking

The timetable generator uses **Constraint Satisfaction Problem (CSP)** with intelligent heuristics:

```
TimetableCSP {
  Variables: Required sessions (subject × hoursPerWeek)
  Domains:   All (day, slot, faculty, classroom) combinations
  Constraints:
    1. No faculty overlap (same faculty, same time)
    2. No classroom clash (same room, same time)
    3. Faculty max hours per day respected
    4. Faculty unavailable slots excluded
    5. Same subject max 2× per day
    6. Break slots reserved
    7. Priority subjects → morning slots preferred
}
```

**Heuristics applied:**
- **MRV** (Minimum Remaining Values): Schedule sessions with fewest faculty options first
- **LCV** (Least Constraining Value): Prefer assignments that block fewest future sessions
- **Forward checking**: Validate each assignment before recursing
- **Backtracking**: Undo and try alternatives on failure
- **Greedy fallback**: If backtracking times out (100k iterations), fill remaining with greedy assignment

---

## 📊 Database Schema

### Subject
```json
{
  "name": "Mathematics",
  "code": "MATH101",
  "hoursPerWeek": 4,
  "type": "theory | lab | tutorial",
  "isPriority": true,
  "color": "#3B82F6"
}
```

### Faculty
```json
{
  "name": "Dr. Rajesh Kumar",
  "email": "rajesh@college.edu",
  "department": "Mathematics",
  "subjects": ["<SubjectId>"],
  "maxHoursPerDay": 6,
  "availableDays": ["Monday", "Tuesday", ...],
  "unavailableSlots": [{ "day": "Monday", "slot": "9:00 AM - 9:55 AM" }]
}
```

### Timetable
```json
{
  "name": "CSE First Year 2024",
  "department": "Computer Science",
  "semester": "Odd Semester",
  "workingDays": ["Monday", ...],
  "timeSlots": ["8:00 AM - 8:55 AM", ...],
  "breakSlots": ["12:00 PM - 12:55 PM"],
  "slots": [{
    "day": "Monday",
    "timeSlot": "8:00 AM - 8:55 AM",
    "subject": "<SubjectId>",
    "faculty": "<FacultyId>",
    "classroom": "<ClassroomId>",
    "isBreak": false
  }],
  "generationStats": {
    "conflicts": 12,
    "iterations": 450,
    "timeTaken": 230
  }
}
```

---

## 📥 CSV Import Format

### subjects_sample.csv
```csv
name,code,hoursPerWeek,type,isPriority
Mathematics,MATH101,4,theory,true
Physics Lab,PHY201,2,lab,false
```

### faculty_sample.csv
```csv
name,email,department,maxHoursPerDay
Dr. Smith,smith@college.edu,Science,6
Prof. Johnson,johnson@college.edu,Math,5
```

---

## ✨ Features

- ✅ **Auto-generate** timetable using CSP + Backtracking
- ✅ **Class-wise**, **Faculty-wise**, **Room-wise** views
- ✅ **Manual edit** any slot via modal
- ✅ **Export to PDF** (landscape, colored)
- ✅ **Export to Excel** (class + faculty sheets)
- ✅ **CSV import** for bulk data entry
- ✅ **Break/lunch slot** configuration
- ✅ **Priority subject** morning scheduling
- ✅ **JWT authentication**
- ✅ **Responsive** mobile-friendly design
- ✅ **Sample data seeder** for quick demo

---

## 🛠️ VS Code Extensions Recommended

- **REST Client** – Test API endpoints
- **MongoDB for VS Code** – Browse database
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Prettier – Code formatter**
