import { RekognitionClient, DeleteCollectionCommand, CreateCollectionCommand } from "@aws-sdk/client-rekognition";
import { NextResponse } from "next/server";

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-south-1', // e.g., "us-east-1"
  credentials: async () => ({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    })
});

export async function POST(request: Request) {
  try {
    const { collectionId } = await request.json();

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    // Step 1: Delete existing collection
    try {
      const deleteCommand = new DeleteCollectionCommand({
        CollectionId: collectionId,
      });
      await rekognitionClient.send(deleteCommand);
      console.log(`Deleted collection: ${collectionId}`);
    } catch (error: any) {
      // Ignore if collection doesn't exist
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Step 2: Create new collection
    const createCommand = new CreateCollectionCommand({
      CollectionId: collectionId,
    });

    const response = await rekognitionClient.send(createCommand);

    return NextResponse.json({
      success: true,
      message: "Collection reset successfully",
      collectionArn: response.CollectionArn,
      statusCode: response.StatusCode,
    });

  } catch (error: any) {
    console.error("Error resetting collection:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to reset collection",
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}