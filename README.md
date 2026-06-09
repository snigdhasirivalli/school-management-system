# Academix Pro: School Management System

Academix Pro is a modern, high-performance School Management System designed with role-based dashboard widgets, conflict-free timetable scheduling, daily attendance registries, and grade report cards.

🌐 **Live Demo Website:** [https://school-frontend-3sl7.onrender.com/](https://school-frontend-3sl7.onrender.com/)

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC)**:
  * **Admin**: Manage the school directory (classes, sections, subjects, teachers, and students), view fees ledgers, and check daily attendance/grade reports.
  * **Teacher**: Mark attendance for assigned classes, input student exam marks, and view registry details.
  * **Student**: View personalized timetables, download/print auto-generated report cards, and view outstanding tuition fees.
* **Timetable Scheduler**: A conflict-free greedy scheduler allocating 1,800+ slots based on class and teacher availability constraints.
* **Auto-Generated Report Cards**: Direct PDF-printable report card generation for students showing mid-term, final, and cumulative percentages.
* **Tuition Fees Ledger**: System to log tuition payments, calculate remaining balances, and flag payment statuses (paid, partial, pending).
* **Automated Data Seeding**: Populates the database with 1,200+ students, 60+ teachers, 6,000+ attendance records, and 18,000+ grade sheets.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite), Axios, Single Page Router routing, HSL tailored CSS variables.
* **Backend**: Django, Django REST Framework, Simple JWT (JSON Web Tokens).
* **Database**: SQLite (Local Dev), PostgreSQL hosted on Neon (Production).
* **Server & Nginx**: Gunicorn WSGI, Nginx reverse proxy routing `/api/` and `/admin/` requests.
* **Containerization**: Docker & Docker Compose orchestrating frontend and backend containers.
* **PaaS Hosting**: Render (Web Service for backend, Static Site for frontend).

---

## 🏛️ System Architecture

The following diagram represents the core architecture, data sync flow, and the interaction of newly implemented frontend/backend upgrades (Toasts, Skeletons, and Audit Logs logging hooks):

```mermaid
graph TD
    subgraph Client [React Frontend (Vite)]
        UI[User Interface]
        TC[ToastContext / notifications]
        SL[Skeleton Loaders]
        DB[Dashboard / SVG Trends Chart]
        PR[Profile Settings]
        AL[Audit Logs Viewer]
    end

    subgraph Server [Django Backend]
        API[DRF API views / JWT auth]
        LH[Logging Hooks]
        MOD[Models: User, AuditLog, Student, Teacher, Attendance, Mark]
    end

    subgraph Storage [Databases]
        NEON[(Neon PostgreSQL - Production)]
        SQLITE[(SQLite - Local Fallback)]
    end

    UI -->|User Interactions / JWT Auth| API
    API -->|Logs Operations| LH
    LH -->|Create Log Entry| MOD
    API -->|Fetch/Update Data| MOD
    MOD -->|Sync Prod| NEON
    MOD -->|Sync Dev| SQLITE
```

---

## 📊 Database Schema (Class Diagram)

The following class diagram represents the core database models, their fields, and relationships:

![Database Class Diagram](./database_class_diagram.png)

### Mermaid Text Representation
```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string email
        +string phone
        +string role
        +bool is_verified
        +string otp
    }

    class AuditLog {
        +int id
        +User actor
        +string action
        +string details
        +datetime timestamp
        +string ip_address
    }

    class SchoolClass {
        +int id
        +string name
    }

    class Section {
        +int id
        +string name
        +SchoolClass school_class
    }

    class Subject {
        +int id
        +string name
    }

    class Teacher {
        +int id
        +User user
        +string employee_id
        +Subject[] subjects
        +SchoolClass[] classes
        +Section[] sections
    }

    class Student {
        +int id
        +User user
        +string admission_number
        +date date_of_birth
        +string gender
        +string parent_name
        +string parent_phone
        +string address
        +SchoolClass school_class
        +Section section
    }

    class Attendance {
        +int id
        +Student student
        +User marked_by
        +date date
        +string status
        +datetime created_at
    }

    class Mark {
        +int id
        +Student student
        +Subject subject
        +int class_test_marks
        +int term_exam_marks
        +int total_marks
        +string grade
        +User entered_by
        +datetime entered_at
    }

    class Timetable {
        +int id
        +SchoolClass school_class
        +Section section
        +Subject subject
        +Teacher teacher
        +string day_of_week
        +time start_time
        +time end_time
        +string room_number
    }

    class Fee {
        +int id
        +Student student
        +decimal total_amount
        +decimal paid_amount
        +decimal remaining_amount
        +string payment_status
        +datetime last_updated
    }

    class Notification {
        +int id
        +User recipient
        +string title
        +string message
        +bool is_read
        +datetime created_at
    }

    User "1" <-- "0..1" Teacher : profile
    User "1" <-- "0..1" Student : profile
    User "1" <-- "0..*" AuditLog : actor
    SchoolClass "1" <-- "0..*" Section : school_class
    SchoolClass "1" <-- "0..*" Student : school_class
    Section "1" <-- "0..*" Student : section
    Teacher "0..*" --> "0..*" Subject : teaches
    Teacher "0..*" --> "0..*" SchoolClass : classes
    Teacher "0..*" --> "0..*" Section : sections
    Student "1" <-- "0..*" Attendance : student
    User "1" <-- "0..*" Attendance : marked_by
    Student "1" <-- "0..*" Mark : student
    Subject "1" <-- "0..*" Mark : subject
    User "1" <-- "0..*" Mark : entered_by
    Student "1" <-- "0..*" Fee : student
    User "1" <-- "0..*" Notification : recipient
    SchoolClass "1" <-- "0..*" Timetable : school_class
    Section "1" <-- "0..*" Timetable : section
    Subject "1" <-- "0..*" Timetable : subject
    Teacher "1" <-- "0..*" Timetable : teacher
```

---

## 🔐 Login Credentials (For Testing)

A complete list of all 1,265 registered test accounts is exported in [credentials.csv](./credentials.csv). Here are the primary accounts to test each role:

| Role | Email / Login | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `snigdha@test.com` | `admin123` | View Reports, Manage Timetables/Registry, Audit Fees. |
| **Teacher** | `teacher_1@school.com` | `teacher123` | Mark Attendance, Add Exam Marks, View own classes. |
| **Student** | `student_1@school.com` | `student123` | View Timetable, View Fees, View/Print Report Card. |

---

## 💻 Running the Project Locally

### Option A: Running with Docker Compose (Recommended)
Make sure Docker Desktop is running on your machine, then run:
```bash
docker compose up --build
```
Once the containers build, open **[http://localhost/](http://localhost/)** in your browser.

### Option B: Running natively (Without Docker)

#### 1. Backend Setup:
```bash
cd backend
python -m venv venv
# Activate virtualenv (Windows PowerShell: venv\Scripts\Activate.ps1)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Cloud Deployment
For instructions on deploying the application to the live internet using Render (PaaS) or a VPS (virtual private server), please refer to the detailed [deployment_guide.md](./deployment_guide.md).
