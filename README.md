# Amber Smart Monitor

A real-time electric consumption monitoring web application for Amber Electric customers.

![Amber Smart Monitor](https://img.shields.io/badge/React-18.2-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## Features

- **Real-time Usage Monitoring**: View your electricity consumption in real-time
- **Multiple Time Ranges**: Switch between 6h, 12h, 24h, and current day views
- **Daily Reports**: View your usage history for the last 30 days
- **Interactive Charts**: Click on daily bars to see detailed hourly usage
- **Price Tracking**: Monitor electricity prices and renewable energy percentages
- **Secure API Key Storage**: Your API key is stored locally in your browser
- **Mock Development Login**: Quick authentication for development/testing

## Pages

### 1. Login
- Enter your Amber Electric API key
- Use "Dev Test Key" for quick development authentication
- API key is securely stored in browser localStorage

### 2. Live Usage
- Real-time electricity price graph
- Current price, average price, and renewables percentage
- Time range selector (6h, 12h, 24h, current day)
- Auto-refreshes every 5 minutes
- Color-coded price indicators (spike, high, neutral, low, etc.)

### 3. Daily Report
- Overview of last 30 days usage
- Click any bar to see detailed hourly breakdown
- Shows general usage and solar exports
- Total usage, cost, and renewables statistics

## Technology Stack

- **Frontend Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Routing**: React Router DOM 6.20
- **Charts**: Recharts 2.10
- **Date Handling**: date-fns 3.0
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Amber Electric API key (get from [Amber Electric Dashboard](https://app.amber.com.au))

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd amber-smart-monitor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

5. Login with your Amber Electric API key or use the "Dev Test Key" button for testing

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment to Railway

### Option 1: Deploy via Railway CLI

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize a new project:
```bash
railway init
```

4. Deploy:
```bash
railway up
```

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [Railway](https://railway.app)
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your repository
6. Railway will automatically detect the configuration and deploy

### Environment Variables (Railway)

No environment variables are required as this is a frontend-only application. The API key is stored in the user's browser localStorage.

## API Integration

This application uses the [Amber Electric Public API](https://api.amber.com.au/v1):

- **GET /sites** - Get user's sites
- **GET /sites/{siteId}/prices/current** - Get current prices
- **GET /sites/{siteId}/prices** - Get historical prices
- **GET /sites/{siteId}/usage** - Get usage data

## Security Notes

- API keys are stored in browser localStorage only
- No backend server means no server-side API key exposure
- All API calls are made directly from the browser to Amber Electric API
- Mock login is for development only - use real API keys in production

## Project Structure

```
amber-smart-monitor/
├── public/
├── src/
│   ├── components/
│   │   └── Navigation.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── LiveUsage.jsx
│   │   └── DailyReport.jsx
│   ├── services/
│   │   ├── amberApi.js
│   │   └── auth.js
│   ├── utils/
│   │   └── storage.js
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── railway.json
└── nixpacks.toml
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT

## Support

For issues with the Amber Electric API, contact [dev@amber.com.au](mailto:dev@amber.com.au)
