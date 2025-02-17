import { RekognitionClient, CreateCollectionCommand } from "@aws-sdk/client-rekognition";
import { NextResponse } from "next/server";

const rekognitionClient = new RekognitionClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1', // e.g., "us-east-1"
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

    const command = new CreateCollectionCommand({
      CollectionId: collectionId,
    });

    const response = await rekognitionClient.send(command);

    return NextResponse.json({
      success: true,
      collectionId,
      collectionArn: response.CollectionArn,
      statusCode: response.StatusCode,
    });

  } catch (error: any) {
    console.error("Error creating Rekognition collection:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create collection",
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}