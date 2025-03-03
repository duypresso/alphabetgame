import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const sampleWords = [
    {
        letter: "A",
        word: "Apple",
        imageUrl: "https://alphabetgame.s3.amazonaws.com/apple.png"
    },
    {
        letter: "B",
        word: "Ball",
        imageUrl: "https://alphabetgame.s3.amazonaws.com/ball.png"
    },
    // Add more sample data here
];

async function initDatabase() {
    const client = new MongoClient(process.env.MONGO_URI || '');
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('alphabetgame');
        const collection = db.collection('words');
        
        // Clear existing data
        await collection.deleteMany({});
        
        // Insert sample data
        const result = await collection.insertMany(sampleWords);
        console.log(`Successfully inserted ${result.insertedCount} documents`);
        
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await client.close();
    }
}

initDatabase();
