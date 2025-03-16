# Alphabet Game

A fun and interactive educational game designed to help users learn the alphabet and vocabulary through engaging gameplay and practice modes.

## Project Overview

Alphabet Game is an educational application that combines visual and audio elements to create an immersive learning experience. The game features:

- Main menu with different game modes
- Practice mode for learning new words
- Interactive gameplay with sound effects
- Visual representation of words with corresponding images

## Tech Stack

### Frontend
- **TypeScript** - Main programming language
- **React** - UI library for component-based development
- **Webpack** - Module bundler
- **HTML/CSS** - Structure and styling

### Backend
- **Go** - Server-side language
- **RESTful API** - Communication between frontend and backend

### Storage
- **AWS S3** - Asset storage (images and audio files)
- **MongoDB** - Word storage and link to image on AWS S3

### Assets
- Custom images for visual representation
- Audio files for sound effects and background music

## Prerequisites

- Node.js (v14+)
- Go (v1.16+)
- Cloud storage account (for asset hosting)
- MongoDB or similar database (based on setup scripts)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/alphabetgame.git
cd alphabetgame
```

2. Install frontend dependencies:
```bash
npm install
```

3. Set up Go dependencies:
```bash
cd backend
go mod download
cd ..
```

4. Configure environment variables:
```bash
# Copy the example .env files
cp .env.example .env
cp backend/.env.example backend/.env
```

5. Edit the `.env` files with your configuration settings

## Database Setup

1. Initialize the database:
```bash
cd backend/initdb
go run main.go
cd ../..
```

2. Set up asset storage:
```bash
cd backend/setup
go run create_bucket.go
go run upload_assets.go
go run verify_upload.go
cd ../..
```

## Running the Application

### Development Mode

1. Start the backend server:
```bash
cd backend
go run main.go
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:8080`

### Production Mode

1. Build the frontend:
```bash
npm run build
```

2. Build the backend:
```bash
cd backend
go build
```

3. Start the server:
```bash
./backend
```

## Project Structure

```
.
├── assets/                  # Game assets and resources
│   ├── A/                   # Alphabet-specific images
│   │   ├── airplane.png
│   │   ├── ant.png
│   │   └── apple.png
│   ├── audio/               # Sound effects and music
│   │   ├── egg_cracking.mp3
│   │   ├── gameplay.mp3
│   │   └── mainmenu.mp3
│   ├── word-images/         # Images for vocabulary words
│   │   └── checklist.md
│   ├── broken_egg.png
│   ├── egg.png
│   └── partical.png
├── backend/                 # Go server implementation
│   ├── initdb/              # Database initialization
│   │   └── main.go
│   ├── setup/               # Cloud storage configuration
│   │   ├── create_bucket.go
│   │   ├── upload_assets.go
│   │   └── verify_upload.go
│   ├── .env
│   ├── go.mod
│   ├── go.sum
│   └── main.go
├── scripts/                 # Utility scripts
│   ├── create-placeholder-egg.js
│   ├── create-word-images.js
│   └── prepare-word-images.js
├── src/                     # Frontend source code
│   ├── main/                # Main process code
│   │   └── main.ts
│   ├── renderer/            # UI rendering and game logic
│   │   ├── components/      # Reusable UI components
│   │   │   └── TitleBar.tsx
│   │   ├── styles/          # Component-specific styles
│   │   │   └── titlebar.css
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── Game.ts
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── index.tsx
│   │   ├── MainMenu.ts
│   │   ├── PracticeMode.ts
│   │   └── styles.css
│   ├── scripts/             # Frontend scripts
│   │   └── initDb.ts
│   ├── server/              # Server communication
│   │   └── index.ts
│   ├── services/            # API and data services
│   │   └── wordService.ts
│   ├── types/               # TypeScript type definitions
│   │   └── Word.ts
│   ├── index.css
│   └── index.html
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── go.mod                   # Go module definition
├── go.sum                   # Go dependencies checksum
├── package.json             # Node.js package definition
├── tsconfig.json            # TypeScript configuration
└── webpack.config.js        # Webpack configuration
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production assets
- `npm run prepare-word-images` - Process word images for the game



