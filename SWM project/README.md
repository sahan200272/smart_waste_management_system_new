# Smart Waste Management System

A real-time waste bin monitoring system with automatic segregation detection, resident notifications, and maintenance workflow management.

## Features

- **Real-time Monitoring**: Live bin status updates via Socket.IO
- **Automatic Segregation Detection**: Detects mixed waste and triggers alerts
- **Resident Notifications**: Push notifications for fill levels and segregation issues
- **Maintenance Queue**: Automated ticket creation and management
- **Sensor Simulator**: Test the system with simulated sensor data
- **Responsive Dashboard**: Modern UI with real-time updates

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- RESTful API design

### Frontend
- React 19 with Vite
- Zustand for state management
- Socket.IO client for real-time updates
- Tailwind CSS for styling
- React Router for navigation

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-waste-management
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/smart-waste-management
   VITE_API_URL=http://localhost:5000
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system. If using a local installation:
   ```bash
   mongod
   ```

## Running the Application

### Option 1: Run everything with one command (recommended)
```bash
npm run dev
```

This will start both the backend and frontend servers concurrently.

### Option 2: Run servers separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 3: Run the sensor simulator
```bash
npm run sim
```

## Usage

1. **Access the Dashboard**
   - Open your browser and go to `http://localhost:3000`
   - The dashboard shows real-time bin status, alerts, and statistics

2. **Start the Simulator**
   - Run `npm run sim` in a separate terminal
   - This will simulate sensor data and create realistic scenarios

3. **Monitor Bins**
   - View all bins on the dashboard
   - Click on any bin to see detailed information
   - Watch for real-time updates as the simulator runs

4. **Manage Maintenance**
   - Navigate to the Maintenance page
   - View, schedule, and close maintenance tickets
   - Tickets are automatically created for offline bins and mixed waste

5. **Resident Notifications**
   - Visit the Residents page to see notifications
   - Submit manual reports for segregation issues
   - Mark notifications as read

## API Endpoints

### Bins
- `POST /api/bins/ingest` - Ingest sensor data
- `GET /api/bins` - Get all bins
- `GET /api/bins/:binId` - Get specific bin
- `PATCH /api/bins/:binId/segregation-done` - Mark segregation as done

### Maintenance
- `POST /api/maintenance` - Create maintenance ticket
- `GET /api/maintenance` - Get all tickets
- `GET /api/maintenance/:id` - Get specific ticket
- `PATCH /api/maintenance/:id/schedule` - Schedule ticket
- `PATCH /api/maintenance/:id/close` - Close ticket

### Reports
- `POST /api/reports/manual` - Submit manual report
- `POST /api/reports/bulk-sync` - Bulk sync sensor data
- `GET /api/reports/notifications` - Get notifications
- `PATCH /api/reports/notifications/:id/read` - Mark notification as read

## System Flow

1. **Sensor Data Ingestion**
   - Waste tracking devices send periodic sensor data
   - System classifies waste: biodegradable, recyclable, non_biodegradable
   - Mixed waste detection triggers segregation alerts

2. **Real-time Updates**
   - Socket.IO broadcasts bin updates to connected clients
   - Dashboard updates automatically without page refresh
   - Residents receive notifications for important events

3. **Maintenance Workflow**
   - Offline bins automatically create maintenance tickets
   - Mixed waste detection creates segregation tickets
   - Manual reports from residents create tickets
   - WMA can schedule and close tickets

4. **Notification System**
   - High fill levels trigger resident notifications
   - Segregation issues create alerts
   - Maintenance updates notify relevant parties

## Testing

The system includes a comprehensive sensor simulator that:
- Generates realistic sensor data for 5 demo bins
- Simulates mixed waste detection (10% chance)
- Creates high fill level scenarios
- Includes offline mode simulation
- Generates manual reports occasionally

## Project Structure

```
SWM PROJECT/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── model/          # MongoDB models
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic services
│   ├── scripts/
│   │   └── simulator.js    # Sensor data simulator
│   ├── server.js           # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # API helper functions
│   │   ├── components/     # Reusable components
│   │   ├── lib/            # Utilities (Socket.IO)
│   │   ├── pages/          # Page components
│   │   └── store/          # Zustand stores
│   ├── vite.config.js
│   └── package.json
├── .env                    # Environment variables
├── .gitignore
└── README.md
```

## Troubleshooting

1. **MongoDB Connection Issues**
   - Ensure MongoDB is running
   - Check the MONGO_URI in .env file
   - Verify MongoDB port (default: 27017)

2. **Socket.IO Connection Issues**
   - Check CORS settings in server.js
   - Verify VITE_API_URL in .env
   - Ensure both servers are running

3. **Simulator Issues**
   - Make sure backend is running before starting simulator
   - Check API_BASE_URL in simulator.js
   - Verify network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
