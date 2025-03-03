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

	// Create session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		log.Fatal(err)
	}

	// Create S3 service client
	svc := s3.New(sess)

	// Create bucket
	_, err = svc.CreateBucket(&s3.CreateBucketInput{
		Bucket: aws.String(os.Getenv("AWS_S3_BUCKET")),
	})
	if err != nil {
		log.Printf("Could not create bucket: %v", err)
		return
	}

	// Set bucket policy for public read access
	policy := `{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::` + os.Getenv("AWS_S3_BUCKET") + `/*"
            }
        ]
    }`

	_, err = svc.PutBucketPolicy(&s3.PutBucketPolicyInput{
		Bucket: aws.String(os.Getenv("AWS_S3_BUCKET")),
		Policy: aws.String(policy),
	})
	if err != nil {
		log.Printf("Unable to update bucket policy: %v", err)
		return
	}

	log.Println("Successfully created bucket and set policy")
}
