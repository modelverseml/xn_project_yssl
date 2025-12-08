# YSSL Regulatory Project 

This project is a full-stack regulatory analysis tool.  
It accepts regulatory **URLs or text**, processes them through an NLP pipeline, stores results in an SQL database, and displays insights through a **Node.js frontend**.

---

## 📁 Folder Structure

```bash
regulatory_project/
├── requirements.txt
├── regulatory_project/
│ ├── regulatory_project/ # Django settings, URLs
│ ├── regulatory_app/ # Backend logic
│ │ ├── models.py # Database models
│ │ ├── views.py # API endpoints
│ │ ├── utils/ # NLP (summary, tags, scoring)
│ │ ├── migrations/
│ │ └── ...
│ └── ...
│
├── frontend_app/
│ ├── src/
│ │ ├── pages/ # Pages (Home, Upload, Results)
│ │ ├── components/ # UI components
│ │ ├── api/ # API fetch logic
│ │ └── ...
│ ├── package.json
│ └── ...
└── README.md
```
---





## Setup Instructions

### 1️⃣ Backend Setup (Django + DRF)

#### 1. Create Virtual Environment
```bash
cd regulatory_project_submission
python3 -m venv venv
source venv/bin/activate       # macOS / Linux

# Windows:
# venv\Scripts\activate

```


#### 2. Install Python Dependencies
```bash 
pip install -r requirements.txt
```

#### 3. Configure SQL Database

The project can run with SQLite by default, or PostgreSQL/MySQL if needed.

Open regulatory_project/regulatory_project/settings.py and update the DATABASES block:

##### PostgreSQL example

```bash

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "regulatory_db",
        "USER": "postgres",
        "PASSWORD": "your_password",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

```

SQLite works without changes (default).

#### 4. Apply Migrations
```bash
python manage.py migrate
```

#### 5. Start Backend Server
```bash
python manage.py runserver
```

Backend is now available at:
```bash
http://127.0.0.1:8000/
```
### 2️⃣ Frontend Setup (Node.js + React)
#### 1. Navigate to Frontend Folder
```bash
cd frontend_app
```
#### 2. Install Node Modules
```bash
npm install
```
#### 3. Start Development Server
```bash
npm start
```

Frontend will run at:
```bash
http://localhost:3000/
```

#### 4. Build Production Version
```bash
npm run build
```

This generates a /build folder ready for deployment.

### 3️⃣ Connect Frontend to Backend

#### Update the API base URL in:
```bash
frontend_app/src/api/config.js
```

Example:
```bash
export const API_BASE = "http://127.0.0.1:8000/api/";
```

### 4️⃣ How the Application Works

- User enters a regulatory URL or uploads a text file.

- Backend processes the input:

    - Fetches or reads the text

    - Generates summary

    - Extracts tags

    - Computes regulatory relevance score

    - Stores results in SQL database

- Frontend displays:

    - Summary

    - Tags

    - Scores

    - Visualizations

### 5️⃣ Notes

Python ≥ 3.9 required

Node ≥ 16 required

Backend must be running before frontend

If database issues occur, delete db.sqlite3 and re-run migrations:

rm db.sqlite3
python manage.py migrate

### 6️⃣ Optional Enhancements

You may consider adding:

API documentation section

Architecture diagram

Screenshots of the app

Deployment instructions (Docker, AWS, etc.)
