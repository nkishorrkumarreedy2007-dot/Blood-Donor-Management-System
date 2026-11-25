# LifeLine – Blood Donor Management System

A responsive blood donor management web application built with **HTML, CSS, JavaScript, Node.js and Express**. It allows users to register donors, search by blood group, view donor contact details, update records and delete records.

## Features

- Responsive landing page and dashboard
- Donor registration with input validation
- Search donors by name, city, phone number or blood group
- Filter donors by blood group and availability
- View donor contact and location information
- Update and delete donor records
- Dashboard statistics (total and available donors)
- Persistent data storage in `data/donors.json`
- Duplicate phone number prevention

## Requirements

- Node.js 18 or later
- npm (included with Node.js)
- A web browser

## Run locally

1. Download or clone this repository.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open **http://localhost:3000** in your browser.

For development with automatic server restart, use `npm run dev`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/donors` | List donors; supports `bloodGroup` and `search` query parameters |
| GET | `/api/stats` | Dashboard statistics |
| POST | `/api/donors` | Register a donor |
| PUT | `/api/donors/:id` | Update a donor |
| DELETE | `/api/donors/:id` | Delete a donor |

## Project structure

```text
Blood-Donor-Management-System/
├── data/
│   └── donors.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Upload to GitHub

1. Create a new repository on [GitHub](https://github.com/new), for example `blood-donor-management-system`.
2. Do not initialize it with a README if you plan to push this project as-is.
3. Open a terminal in this project folder and run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit - Blood Donor Management System"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/blood-donor-management-system.git
   git push -u origin main
   ```

4. Replace `YOUR-USERNAME` with your GitHub username.
5. Copy your repository URL and paste it into the GitHub link field in your assignment Excel sheet.

## Important notes

- Donor data is stored locally in `data/donors.json`. This is suitable for a local academic demonstration. For a public multi-user deployment, use a managed database and persistent storage.
- Do not publish real donor personal information in the repository. The included data file is empty.
- This project is an academic directory/demo, not a medical eligibility screening or emergency blood-matching service. Donors should confirm eligibility with qualified healthcare professionals.
