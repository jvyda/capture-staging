import { RekognitionClient, DescribeCollectionCommand } from "@aws-sdk/client-rekognition";
import { NextResponse } from "next/server";

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  },
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

    const command = new DescribeCollectionCommand({
      CollectionId: collectionId,
    });

    const response = await rekognitionClient.send(command);

    return NextResponse.json({
      success: true,
      faceCount: response.FaceCount,
      creationTimestamp: response.CreationTimestamp,
      collectionARN: response.CollectionARN,
    });

  } catch (error: any) {
    console.error("Error getting collection stats:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to get collection stats",
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}