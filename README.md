# SokoInsight - Universal Market Analytics Platform

A comprehensive web-based market analytics platform for Kenyan sellers (small traders, e-commerce sellers, and wholesalers).

## Features

- **Unified Analytics** - Aggregate sales data from multiple channels
- **Demand Forecasting** - ML-powered predictions for inventory planning
- **Competitor Intelligence** - Track competitor prices and market trends
- **M-Pesa Integration** - Import and analyze M-Pesa transaction statements
- **Offline Support** - PWA with offline data entry and sync
- **Multi-language** - English and Swahili support
- **SMS Notifications** - Alerts via Africa's Talking API

## Tech Stack

### Frontend
- React 18 with TypeScript
- Ant Design UI components
- Recharts for data visualization
- Zustand for state management
- React Router for navigation

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Multer for file uploads

### ML Service
- Python with FastAPI
- Prophet for time series forecasting
- pytrends for Google Trends

## Project Structure

```
soko-insight/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── ml-service/             # Python ML microservice
├── database/
│   └── migrations/         # SQL migrations
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Python 3.9+ (for ML service)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/soko-insight.git
cd soko-insight
```

2. Install dependencies
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ../ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up environment variables
```bash
cp server/.env.example server/.env
# Edit .env with your database credentials
```

4. Run database migrations
```bash
npm run db:migrate
```

5. Start the ML service (in a separate terminal)
```bash
cd ml-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

6. Start development servers
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- ML Service: http://localhost:8000

## Environment Variables

### Server (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/soko_insight
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000
```

## API Documentation

See [API.md](./docs/API.md) for detailed API documentation.

License

MIT License - see [LICENSE](./LICENSE) for details.
