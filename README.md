# 🌱 AgriTech: Smart Farming Platform

AgriTech is a comprehensive, state-of-the-art farming management platform designed to empower farmers with real-time soil analysis, machine learning-driven crop recommendations, and an integrated AI assistant for expert agricultural advice.

![Platform Preview](https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop)

## ✨ Features

### 📡 Real-time Monitoring
- **Hardware Integration**: Seamlessly connects to physical sensors via a serial bridge.
- **Dynamic Metrics**: Monitor Nitrogen (N), Phosphorus (P), Potassium (K), Moisture, Temperature, pH, and Conductivity (EC) in real-time.
- **Soil Health Index**: Proprietary calculation to evaluate overall soil viability.

### 🧠 ML Crop Prediction
- **Intelligent Recommendations**: High-accuracy Scikit-learn model predicts the ideal crop based on live sensor data.
- **Historical Analysis**: Tracks prediction history to monitor soil changes over time.

### 🤖 AI Agricultural Assistant
- **Expert Advice**: Integrated AI chat assistant specifically trained for agricultural queries.
- **Context Awareness**: Leverages current soil data to provide personalized farming tips.

### 🛡️ Secure Admin Portal
- **Global Oversight**: Restricted access for administrators to monitor platform-wide activity.
- **User Management**: View, ban, and unban users with a single click.
- **Global Logs**: Monitor every prediction and AI interaction across the entire platform.

### 🎫 Query & Support System
- **Ticketing System**: Users can submit specific farming queries to the admin team.
- **Interactive Responses**: Admins can directly answer user questions from the dashboard.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS & Framer Motion (for premium animations)
- **UI Components**: Shadcn/UI
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter

### Backend
- **Server**: Node.js & Express
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (with local JSON fallback)
- **Authentication**: Passport.js with session persistence

### Machine Learning
- **API**: Flask (Python)
- **Model**: Scikit-learn (RandomForest/XGBoost)
- **Serial Bridge**: Python-based bridge for hardware communication

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- PostgreSQL (Optional, defaults to local JSON storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kasireddy-Seshi-Reddy/agri-tech.git
   cd agri-tech
   ```

2. **Install Dependencies**
   ```bash
   # Install Frontend & Backend dependencies
   npm install
   
   # Install ML Model dependencies
   cd ml-model
   pip install -r requirements.txt
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_postgresql_url_here
   SESSION_SECRET=your_random_secret_here
   ```

4. **Run the Application**
   ```bash
   # Start the ML API (from ml-model folder)
   python app.py
   
   # Start the Main Platform (from root folder)
   npm run dev
   ```

## 📁 Project Structure

```text
├── backend/            # Express server & API routes
├── frontend/           # React application & UI components
├── shared/             # Drizzle schema & shared types
├── ml-model/           # Python ML model & Serial Bridge
└── attached_assets/    # Images and static assets
```
---
Built with ❤️ for modern agriculture.
---
LIVE DEPLOYED LINK - https://agri-tech-dashboard.onrender.com
