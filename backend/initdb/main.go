package main

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Load .env file
	if err := godotenv.Load("../../.env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Connect to MongoDB
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	// Get collection
	collection := client.Database("alphabetgame").Collection("words")

	// Sample data structure matching your existing database
	words := []struct {
		Images []struct {
			Letter   string `bson:"letter"`
			Word     string `bson:"word"`
			ImageURL string `bson:"imageUrl"`
		} `bson:"images"`
	}{
		{
			Images: []struct {
				Letter   string `bson:"letter"`
				Word     string `bson:"word"`
				ImageURL string `bson:"imageUrl"`
			}{
				{
					Letter:   "A",
					Word:     "Ant",
					ImageURL: "https://learnabcapp.s3.ap-southeast-1.amazonaws.com/assets/A/ant.jpg",
				},
				{
					Letter:   "A",
					Word:     "Apple",
					ImageURL: "https://learnabcapp.s3.ap-southeast-1.amazonaws.com/assets/A/apple.jpg",
				},
				// Add more images for letter A
			},
		},
		// Add more entries for other letters
	}

	// Clear existing data
	log.Println("Clearing existing data...")
	if _, err := collection.DeleteMany(context.Background(), bson.M{}); err != nil {
		log.Fatal("Error clearing collection:", err)
	}

	// Insert new data
	log.Println("Inserting new data...")
	for _, word := range words {
		result, err := collection.InsertOne(context.Background(), word)
		if err != nil {
			log.Printf("Error inserting word: %v", err)
		} else {
			log.Printf("Inserted document with ID: %v", result.InsertedID)
		}
	}

	log.Println("Database initialization complete!")
}
