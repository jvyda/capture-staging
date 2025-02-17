import { NextResponse } from 'next/server';
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
const sqsClient = new SQSClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});
export async function POST(request:Request) {

    // Parse the incoming request body
    const data = await request.json();
    const { userId, eventId, sourceType, photoId, frameId, videoId, rekognitionCollectionId, bucketName, s3Key } = data;
    const messageBody = {
        bucketName,
        s3Key,
        userId,
        eventId,
        rekognitionCollectionId,
        sourceType,
        photoId,
        frameId,
        videoId,
        photosTable: process.env.NEXT_PUBLIC_DYNAMODB_PHOTOS_TABLE_NAME,
        framesTable: process.env.NEXT_PUBLIC_DYNAMODB_FRAMES_TABLE_NAME,
        facesTable: process.env.NEXT_PUBLIC_DYNAMODB_FACES_TABLE_NAME,
        personsTable: process.env.NEXT_PUBLIC_DYNAMODB_PERSONS_TABLE_NAME,
        appSyncEndpoint: process.env.NEXT_PUBLIC_APPSYNC_API_ENDPOINT,
        appSyncApiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY
      };
      
      const params = {
        QueueUrl: process.env.NEXT_PUBLIC_SQS_FACE_DETECTION_QUEUE_URL,
        MessageBody: JSON.stringify(messageBody),
        MessageAttributes: {
          "MessageType": {
            DataType: "String",
            StringValue: "FaceDetection"
          }
        }
      };

      let sqsStatus = await sqsClient.send(new SendMessageCommand(params));

      return NextResponse.json({ 
        success: true, 
        messagesSent: 1,
        message: "Message sent to face detection queue",
        data: sqsStatus
      });
}