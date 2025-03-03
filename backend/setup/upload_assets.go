package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Initialize AWS Session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		log.Fatal(err)
	}

	// Create S3 service client
	svc := s3.New(sess)
	bucket := os.Getenv("AWS_S3_BUCKET")

	// Walk through the assets directory
	assetsDir := "../../assets"
	err = filepath.Walk(assetsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Open the file
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		// Create the S3 key (path in bucket)
		// Convert Windows path to S3 path
		key := strings.TrimPrefix(path, assetsDir)
		key = strings.TrimPrefix(key, "\\")
		key = strings.ReplaceAll(key, "\\", "/")

		// Upload the file
		_, err = svc.PutObject(&s3.PutObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String("word-images/" + key),
			Body:   file,
		})
		if err != nil {
			log.Printf("Failed to upload %s: %v", path, err)
			return err
		}

		log.Printf("Successfully uploaded %s to s3://%s/word-images/%s", path, bucket, key)
		return nil
	})

	if err != nil {
		log.Fatal(err)
	}

	log.Println("Upload completed successfully!")
}
