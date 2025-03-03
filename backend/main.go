package main

import (
	"context"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time" // Add this import

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func init() {
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())
}

type WordImage struct {
	Letter string `json:"letter" bson:"letter"`
	Words  []Word `json:"words" bson:"words"`
}

type Word struct {
	Word     string `json:"word" bson:"word"`
	ImageURL string `json:"imageUrl" bson:"imageUrl"`
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	// Load .env file
	if err := godotenv.Load("../.env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Connect to MongoDB
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	// Initialize router
	r := mux.NewRouter()

	// Handler for getting word by letter
	r.HandleFunc("/api/words/{letter}", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		letter := strings.ToUpper(vars["letter"]) // Use strings.ToUpper instead of toUpperCase
		log.Printf("Received request for letter: %s", letter)

		collection := client.Database("alphabetgame").Collection("words")

		// Initialize new random seed for each request
		rand.Seed(time.Now().UnixNano())

		// Find words for the letter
		var result WordImage
		err := collection.FindOne(context.Background(), bson.M{
			"letter": letter, // Changed from "images.letter" to "letter"
		}).Decode(&result)

		if err != nil {
			if err == mongo.ErrNoDocuments {
				log.Printf("No word found for letter: %s", letter)
				w.WriteHeader(http.StatusNotFound)
				json.NewEncoder(w).Encode(map[string]string{"error": "Word not found"})
				return
			}
			log.Printf("Database error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error"})
			return
		}

		// Select random word from available words
		if len(result.Words) > 0 {
			randomIndex := rand.Intn(len(result.Words))
			selectedWord := result.Words[randomIndex]

			response := struct {
				Letter   string `json:"letter"`
				Word     string `json:"word"`
				ImageURL string `json:"imageUrl"`
			}{
				Letter:   letter,
				Word:     selectedWord.Word,
				ImageURL: selectedWord.ImageURL,
			}

			log.Printf("Randomly selected word: %+v", response)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
		} else {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "No words available for this letter"})
		}
	}))

	// Add test endpoint
	r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) { // Fixed: Request -> *http.Request
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "API is working"})
	})

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
	})

	// Start server
	port := "8080" // Changed from "3000" to "8080"
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, c.Handler(r)); err != nil {
		log.Fatal(err)
	}
}
