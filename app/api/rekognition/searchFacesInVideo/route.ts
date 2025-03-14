import { NextResponse } from 'next/server';
import { RekognitionClient, StartFaceSearchCommand } from '@aws-sdk/client-rekognition';

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bucketName, videoName, collectionId } = body;

    // Validate required parameters
    if (!bucketName || !videoName || !collectionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const params = {
      Video: {
        S3Object: {
          Bucket: bucketName,
          Name: videoName
        }
      },
      CollectionId: collectionId,
      // Optional parameters
      FaceMatchThreshold: 80.0, // Adjust confidence threshold as needed
      NotificationChannel: {
        RoleArn: process.env.REKOGNITION_ROLE_ARN,
        SNSTopicArn: process.env.SNS_TOPIC_ARN
      }
    };

    const command = new StartFaceSearchCommand(params);
    const response = await rekognition.send(command);

    return NextResponse.json({
      success: true,
      jobId: response.JobId
    });

  } catch (error) {
    console.error('Error starting face search:', error);
    return NextResponse.json(
      { error: 'Failed to start face search' },
      { status: 500 }
    );
  }
}
