
# 🏠 Emlak Durağı – Real Estate Listing Website
A full-stack web application built for Emlak Durağı, a real estate agency. The site allows visitors to browse property listings, while authorized admins can manage all listings through a secure panel.
---
## 🚀 Features
### 👥 Visitor Side
- Browse all active property listings
- View detailed information for each listing (photos, price, description, location)
- Clean and responsive UI
### 🔐 Admin Panel
- Secure admin login system
- Add new property listings
- Edit existing listings
- Delete listings
- Full control over all content on the site
---
## 🛠️ Tech Stack
LayerTechnologyFrontendHTML, CSS, JavaScriptBackendNode.js, Express.jsDatabaseSQLiteAuthSession-based admin authentication
---
## 📁 Project Structure
realestate_website/
├── public/          # Frontend (HTML, CSS, JS)
├── server.js        # Express server & API routes
├── database.js      # SQLite database connection & queries
├── package.json     # Dependencies
└── .gitignore
---
## ⚙️ Getting Started
### Prerequisites
- Node.js installed
### Installation
```bash
git clone https://github.com/pelinbingl/realestate_website.git
cd realestate_website
npm install
node server.js
```
Then open your browser and go to `http://localhost:3000\`
---
## 💡 About
This project was built as a personal project to create a real-world property listing platform for a local real estate agency. It simulates a real agency website where only authorized admins can manage listings, while visitors can freely browse available properties.
