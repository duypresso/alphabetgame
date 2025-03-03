# Alphabet Learning Game

A fun and interactive game for children to learn the alphabet through egg-breaking and word association.

## Features

- Interactive egg-breaking mechanics
- Random word generation for each letter
- Visual and animated feedback
- Progress tracking
- Responsive design for all screen sizes
- Full-screen support
- Particle effects and celebrations

## Tech Stack

- Frontend:
  - React
  - Phaser 3
  - TypeScript
  - CSS3
- Backend:
  - Golang
  - MongoDB
  - AWS S3 (for image storage)

## Setup

1. Install dependencies:

# Frontend
npm install

# Backend
go mod tidy
```

2. Create `.env` file in root directory:
```env
MONGO_URI=your_mongodb_connection_string
AWS_S3_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
```

3. Initialize the database:
cd backend/initdb
go run main.go
```

4. Run the application:
# Development (runs both frontend and backend)
npm run dev:all

# Production
npm run build
npm start
```

## Development

- Frontend code is in `src/renderer`
- Backend code is in `backend/`
- Assets should be placed in `assets/`

## File Structure

```
alphabetgame/
├── assets/              # Game assets (images, sounds)
├── backend/            
│   ├── initdb/         # Database initialization
│   ├── setup/          # AWS setup scripts
│   └── main.go         # Backend server
├── src/
│   ├── renderer/       # Frontend game code
│   ├── services/       # Game services
│   └── types/          # TypeScript types
└── package.json
```

## Database Structure & Image Display

### MongoDB Collection Structure
javascript
// Collection: words
{
  "letter": "A",
  "words": [
    {
      "word": "Apple",
      "imageUrl": "https://learnabcapp.s3.ap-southeast-1.amazonaws.com/assets/A/apple.jpg"
    },
    {
      "word": "Ant",
      "imageUrl": "https://learnabcapp.s3.ap-southeast-1.amazonaws.com/assets/A/ant.jpg"
    }
  ]
}
```

### Image Fetching Flow
1. Frontend clicks letter -> Makes API request to `/api/words/{letter}`
2. Backend randomly selects one word-image pair from the array
3. Frontend receives:
```json
{
  "letter": "A",
  "word": "Apple",
  "imageUrl": "https://learnabcapp.s3.ap-southeast-1.amazonaws.com/assets/A/apple.jpg"
}
```
4. Frontend loads image using Phaser's loader
5. Image is displayed in popup with word

### Adding New Words
1. Upload image to S3 bucket in correct folder structure:
```
s3://learnabcapp/assets/
  └── A/
      ├── apple.jpg
      ├── ant.jpg
      └── airplane.jpg
```
2. Add entry to MongoDB collection using initdb script or MongoDB compass

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
