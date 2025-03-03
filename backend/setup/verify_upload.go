package main

import (
	"log"
	"os"

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

	// List all objects in the bucket
	resp, err := svc.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String("word-images/"),
	})

	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Found %d objects in bucket %s:\n", len(resp.Contents), bucket)
	for _, item := range resp.Contents {
		log.Printf("- %s (size: %d bytes)\n", *item.Key, *item.Size)
	}
}
