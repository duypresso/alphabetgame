import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI || '');

app.get('/api/words/:letter', async (req, res) => {
    try {
        console.log(`Received request for letter: ${req.params.letter}`);
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('alphabetgame');
        const collection = db.collection('words');
        
        const word = await collection.findOne({ 
            letter: req.params.letter.toUpperCase() 
        });
        
        console.log('Query result:', word);
        
        if (!word) {
            console.log(`No word found for letter: ${req.params.letter}`);
            res.status(404).json({ error: 'Word not found' });
            return;
        }
        
        res.json(word);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.close();
    }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
