import "dotenv/config";

process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ??= "https://cloud.appwrite.io/v1";
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ??= "test-project";
process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ??= "test-database";
