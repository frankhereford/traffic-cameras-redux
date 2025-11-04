# Traffic Cameras Redux

A sophisticated real-time traffic camera visualization and analysis platform for the City of Austin. This application aggregates live camera feeds from the Austin mobility CCTV network, displays them on an interactive map with satellite view, and includes object detection capabilities to identify traffic incidents.

![Traffic Cameras Redux](https://img.shields.io/badge/Next.js-15.2.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-blue?style=flat-square&logo=postgresql)

## Features

- **Interactive Map Visualization**: Google Maps satellite view centered on Austin with real-time camera positioning
- **Live Traffic Camera Feeds**: Display up to 8 simultaneous camera feeds from the City of Austin CCTV network
- **Draggable Camera Windows**: Customize your camera layout with draggable and resizable windows using glassmorphism UI effects
- **Real-time Camera Status**: Visual indicators showing camera availability (green=working, red=error, grey=unknown)
- **Object Detection**: Automated detection of vehicles, pedestrians, and other objects using machine learning
- **Image Archiving**: Automatic archival of camera snapshots to AWS S3 with SHA-256 hash watermarking
- **Smart Caching**: Redis-powered caching system to reduce latency and server load
- **Responsive Layout**: Automatic camera layout adjustment based on viewport size
- **Type-Safe API**: End-to-end type safety with tRPC and TypeScript

## Technology Stack

### Frontend
- **Next.js 15.2.3** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5.8.2** - Type-safe development
- **TailwindCSS 4.0.15** - Utility-first CSS framework
- **@vis.gl/react-google-maps** - Google Maps integration
- **react-rnd** - Draggable and resizable components
- **liquid-glass-react** - Glassmorphism UI effects

### State Management & Data
- **@tanstack/react-query** - Async state management and caching
- **tRPC** - End-to-end type-safe APIs
- **Zod** - Schema validation
- **NextAuth 5.0** - Authentication framework

### Backend & Database
- **PostgreSQL** with **PostGIS** extension - Geospatial database
- **Prisma** - Type-safe ORM
- **Redis** - High-performance caching layer

### Infrastructure & Deployment
- **Docker & Docker Compose** - Containerization and orchestration
- **AWS Lambda** - Serverless image proxy and detection services
- **AWS S3** - Image storage and archival
- **HAProxy** - Load balancing and reverse proxy
- **Python 3** - Lambda functions for image processing and ML detection

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                    (Next.js Frontend)                            │
└────────────┬─────────────────────────────────┬──────────────────┘
             │                                  │
             │ Google Maps API                  │ tRPC API
             │ (Socrata Data)                   │ (Camera Queries)
             ▼                                  ▼
┌───────────────────────┐          ┌──────────────────────────────┐
│  City of Austin       │          │   PostgreSQL + PostGIS       │
│  Socrata API          │          │   (Camera & Detection DB)    │
└───────────────────────┘          └──────────────┬───────────────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                              │
                         ┌──────────▼──────────┐      ┌──────────▼─────────┐
                         │  Lambda Proxy       │      │  Lambda Detector   │
                         │  (Image Service)    │      │  (ML Service)      │
                         └──────────┬──────────┘      └──────────┬─────────┘
                                    │                              │
                    ┌───────────────┼──────────────┐              │
                    │               │              │              │
         ┌──────────▼─────┐  ┌─────▼──────┐  ┌────▼────────┐ ┌──▼─────────┐
         │ Redis Cache    │  │  AWS S3    │  │Austin CCTV  │ │Beam ML API │
         │ (5min TTL)     │  │ (Archive)  │  │  Network    │ │(Detection) │
         └────────────────┘  └────────────┘  └─────────────┘ └────────────┘
```

## Prerequisites

- **Node.js** 20.x or higher
- **npm** 9.2.0 or higher
- **Docker** and **Docker Compose**
- **AWS Account** (for production deployment)
- **Google Maps API Key** with Maps JavaScript API enabled
- **Google Map ID** for styled maps

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/frankhereford/traffic-cameras-redux.git
cd traffic-cameras-redux
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
# NextAuth Configuration
AUTH_SECRET="your-secret-key-here"  # Generate with: npx auth secret
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5433/nextjs"

# JWT Shared Secret (for Lambda authentication)
JWT_SHARED_SECRET="your-jwt-secret-here"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAP_API_KEY="your-google-maps-api-key"
NEXT_PUBLIC_GOOGLE_MAP_ID="your-google-map-id"
NEXT_PUBLIC_LAMBDA_URL_PROXY="http://localhost:8080"

# Redis Configuration
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"
REDIS_USE_TLS="true"

# AWS Configuration (for production)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="atx-traffic-cameras"

# Beam ML Platform (optional)
BEAM_TOKEN="your-beam-api-token"
DETECTOR_BEAM_LAMBDA="your-beam-lambda-endpoint"

# Detection Configuration
DETECTION_IMAGE_BORDER="10"
DETECTION_IMAGE_QUALITY="85"

# CORS
CORS_VALID_ORIGIN="*"
```

### 3. Install Dependencies

```bash
cd nextjs
npm install
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (after starting Docker services)
npm run db:push
```

## Running the Application

### Development Mode (with Docker)

1. **Start all services:**

```bash
docker-compose up
```

This will start:
- PostgreSQL with PostGIS (port 5433)
- Redis with TLS (port 6379)
- Lambda Proxy Service (port 8080)
- Lambda Detector Service
- Next.js Development Server (port 3000)
- HAProxy (ports 80, 443)

2. **Access the application:**
   - Main application: `http://localhost:3000`
   - Database: `localhost:5433`
   - Proxy service: `http://localhost:8080`

### Development Mode (without Docker)

1. **Start external services:**

```bash
docker-compose up postgis redis proxy proxy-url
```

2. **Run Next.js development server:**

```bash
cd nextjs
npm run dev
```

3. **Access the application:**
   - Main application: `http://localhost:3000`

### Production Mode

```bash
cd nextjs
npm run build
npm start
```

## Project Structure

```
traffic-cameras-redux/
├── nextjs/                          # Main Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Application entry point
│   │   │   ├── layout.tsx          # Root layout with providers
│   │   │   ├── api/
│   │   │   │   ├── auth/           # NextAuth endpoints
│   │   │   │   └── trpc/           # tRPC API endpoints
│   │   │   ├── _components/
│   │   │   │   ├── Application/    # Main app component
│   │   │   │   ├── Draggable/      # Camera window components
│   │   │   │   └── Map/            # Google Maps components
│   │   │   ├── _hooks/
│   │   │   │   ├── useSocrataData.ts              # Fetch camera metadata
│   │   │   │   ├── useActiveCameraManager.ts      # Camera selection logic
│   │   │   │   ├── useCameraStatusMap.ts          # Status queries
│   │   │   │   └── useScreenPositionTracking.ts   # Position calculations
│   │   │   └── _context/
│   │   │       └── ActiveCamerasContext.tsx       # Global camera state
│   │   ├── server/
│   │   │   ├── api/
│   │   │   │   ├── root.ts         # tRPC router aggregator
│   │   │   │   ├── trpc.ts         # tRPC configuration
│   │   │   │   └── routers/
│   │   │   │       └── camera.ts   # Camera API endpoints
│   │   │   ├── auth/               # NextAuth configuration
│   │   │   └── db.ts               # Prisma client
│   │   └── trpc/                   # tRPC client setup
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── package.json
│   └── Dockerfile
│
├── proxy/                           # AWS Lambda image proxy service
│   ├── proxy.py                    # Main handler
│   ├── requirements.txt
│   └── Dockerfile
│
├── detector/                        # AWS Lambda detection service
│   ├── detector.py                 # Main handler
│   ├── requirements.txt
│   └── Dockerfile
│
├── postgis/                         # PostgreSQL configuration
│   ├── init.sh                     # Database initialization
│   ├── server.crt                  # SSL certificate
│   └── server.key
│
├── redis/                           # Redis configuration
│   ├── server.crt
│   └── server.key
│
├── haproxy/                         # Load balancer configuration
│   └── haproxy.cfg
│
├── docker-compose.yaml              # Service orchestration
├── orchestration.sh                 # AWS deployment script
└── README.md
```

## Key Components

### Frontend Components

#### TrafficCamerasApp (`nextjs/src/app/_components/Application/TrafficCamerasApp.tsx`)
The main application component that:
- Wraps the app in `ActiveCamerasProvider` context
- Fetches camera data from Socrata API
- Renders the map view and draggable UI

#### Map (`nextjs/src/app/_components/Map/Map.tsx`)
Google Maps integration featuring:
- Satellite view centered on Austin (30.262531, -97.753983)
- Dynamic zoom levels (8-20)
- Camera position markers colored by status
- Viewport bounds tracking

#### DraggableUI (`nextjs/src/app/_components/Draggable/DraggableUI.tsx`)
Camera window manager with:
- Responsive two-column layout
- Dynamic position calculation
- Visual connection lines from markers to windows
- Automatic layout adjustment based on viewport size

#### CameraImage (`nextjs/src/app/_components/Draggable/CameraImage.tsx`)
Individual camera window with:
- Draggable and resizable functionality
- Glassmorphism styling
- Image loading from Lambda proxy
- SHA-256 hash watermark display

### Custom Hooks

#### useActiveCameraManager (`nextjs/src/app/_hooks/useActiveCameraManager.ts`)
Core camera management logic:
- Filters cameras within map viewport
- Manages up to 8 active camera slots
- Generates JWT tokens for camera access
- Handles random camera selection
- Manages loading states and error recovery

#### useScreenPositionTracking (`nextjs/src/app/_hooks/useScreenPositionTracking.ts`)
Position synchronization:
- Converts map coordinates to screen pixels
- Uses Google Maps OverlayView API
- Updates on pan/zoom with requestAnimationFrame
- Calculates exact display positions for windows
- Draws connection lines from markers to panels

#### useSocrataData (`nextjs/src/app/_hooks/useSocrataData.ts`)
City of Austin data integration:
- Fetches camera metadata from Socrata API
- Filters active cameras (TURNED_ON status)
- Removes duplicates
- Returns location data and camera IDs

#### useCameraStatusMap (`nextjs/src/app/_hooks/useCameraStatusMap.ts`)
Status tracking:
- Queries all cameras from database
- Maps camera ID to HTTP status code
- Provides color coding logic for markers
- Filters working vs. non-working cameras

### Backend Services

#### Camera Router (`nextjs/src/server/api/routers/camera.ts`)
tRPC endpoints:
- `camera.getJwt(cameraId)` - Generate JWT for image access
- `camera.getAllCameras()` - Query all cameras
- `camera.getWorkingCameras()` - Query cameras with status 200

#### Proxy Service (`proxy/proxy.py`)
Lambda function for image proxying:
1. Validates JWT token
2. Checks Redis cache (5-minute TTL)
3. Fetches from Austin CCTV network
4. Updates database with status
5. Archives to S3
6. Adds SHA-256 watermark
7. Returns base64-encoded image

#### Detector Service (`detector/detector.py`)
Lambda function for object detection:
1. Triggered by S3 image upload
2. Sends image to Beam ML service
3. Receives detection results
4. Creates database records
5. Crops detected objects
6. Uploads crops to S3
7. Updates database with results

## API Endpoints

### tRPC API

All tRPC endpoints are accessible at `/api/trpc/[procedure]`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `camera.getJwt` | Query | Generate JWT token for camera access |
| `camera.getAllCameras` | Query | Get all cameras from database |
| `camera.getWorkingCameras` | Query | Get cameras with status code 200 |

### Lambda Proxy Endpoint

**URL**: `http://localhost:8080` (development) or Lambda Function URL (production)

**Authentication**: JWT token (via header, query param, or path)

**Response**: Base64-encoded JPEG image with watermark

## Database Schema

### Key Models

- **Camera**: Stores City of Austin camera ID, current status, relationships
- **Image**: Camera screenshots with SHA-256 hash, detection state, S3 status
- **Detection**: Object bounding boxes, confidence scores, labels
- **CameraStatus**: Historical log of camera status changes
- **Status**: HTTP status codes and availability states
- **User**: NextAuth user accounts
- **Account**: OAuth account links
- **Session**: User sessions

## Data Flow

1. **Camera Discovery**
   - Frontend fetches camera locations from Socrata API
   - Filters cameras within map viewport
   - Selects up to 8 cameras for display

2. **Image Loading**
   - Frontend requests JWT token via tRPC
   - Calls Lambda proxy with JWT
   - Proxy validates JWT and fetches image
   - Image cached in Redis (5 min TTL)
   - Returns watermarked image

3. **Image Archival**
   - Proxy uploads image to S3
   - S3 event triggers detector Lambda
   - Database updated with image record

4. **Object Detection**
   - Detector sends image to Beam ML
   - Receives detection results
   - Crops detected objects
   - Uploads crops to S3
   - Stores detection data in database

## Deployment

### Local Development

See [Running the Application](#running-the-application) section above.

### AWS Deployment

1. **Configure AWS credentials:**

```bash
aws configure
```

2. **Update environment variables in `.env`**

3. **Run deployment script:**

```bash
./orchestration.sh
```

This script will:
- Build Docker images for proxy and detector services
- Push images to AWS ECR
- Update Lambda functions
- Configure function URLs and triggers

### Manual Deployment Steps

1. **Create ECR repositories:**
```bash
aws ecr create-repository --repository-name traffic-cameras-proxy
aws ecr create-repository --repository-name traffic-cameras-detector
```

2. **Create S3 bucket:**
```bash
aws s3 mb s3://atx-traffic-cameras
```

3. **Set up RDS PostgreSQL with PostGIS**

4. **Set up ElastiCache Redis**

5. **Create Lambda functions:**
```bash
aws lambda create-function \
  --function-name traffic-cameras-proxy \
  --package-type Image \
  --code ImageUri=<ecr-uri>:latest \
  --role <lambda-execution-role-arn>
```

6. **Configure S3 trigger for detector Lambda**

7. **Deploy Next.js application** (Vercel, AWS Amplify, or custom server)

## Available Scripts

In the `nextjs` directory:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run check` | Run linter and type checker |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format:check` | Check code formatting |
| `npm run format:write` | Format code with Prettier |
| `npm run typecheck` | Type check TypeScript |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SHARED_SECRET` | Shared secret for JWT signing | Random 32+ character string |
| `NEXT_PUBLIC_GOOGLE_MAP_API_KEY` | Google Maps API key | `AIza...` |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | Google Map style ID | `12abc...` |
| `NEXT_PUBLIC_LAMBDA_URL_PROXY` | Lambda proxy URL | `http://localhost:8080` |
| `AUTH_SECRET` | NextAuth secret | Generate with `npx auth secret` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_DISCORD_ID` | Discord OAuth client ID | - |
| `AUTH_DISCORD_SECRET` | Discord OAuth secret | - |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |
| `REDIS_USE_TLS` | Enable Redis TLS | `true` |
| `AWS_ACCESS_KEY_ID` | AWS access key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `AWS_REGION` | AWS region | `us-east-1` |
| `S3_BUCKET_NAME` | S3 bucket name | `atx-traffic-cameras` |
| `BEAM_TOKEN` | Beam ML API token | - |
| `DETECTOR_BEAM_LAMBDA` | Beam detector endpoint | - |
| `DETECTION_IMAGE_BORDER` | Pixels around detection box | `10` |
| `DETECTION_IMAGE_QUALITY` | JPEG quality for crops | `85` |

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgis

# View PostgreSQL logs
docker-compose logs postgis

# Connect to database manually
docker-compose exec postgis psql -U postgres -d nextjs
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose ps redis

# View Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli -a your-password --tls
```

### Lambda Proxy Not Working

```bash
# Check proxy service logs
docker-compose logs proxy

# Check proxy-url emulator logs
docker-compose logs proxy-url

# Test proxy endpoint
curl http://localhost:8080
```

### Image Not Loading

1. Check JWT token is valid
2. Verify camera ID exists in Austin CCTV network
3. Check proxy logs for errors
4. Verify Redis is accessible
5. Check network connectivity to `cctv.austinmobility.io`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- City of Austin for providing the Socrata API and CCTV network access
- Austin Mobility for maintaining the traffic camera infrastructure
- Google Maps Platform for mapping services
- The open-source community for the amazing tools and libraries

## Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the Austin community**
