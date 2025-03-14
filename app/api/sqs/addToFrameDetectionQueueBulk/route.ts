import { NextResponse } from 'next/server';
import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { generateClient } from 'aws-amplify/data';

import type { Schema } from '@/amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';



// Configure Amplify for server-side usage
Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();
const sqsClient = new SQSClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Sends messages to SQS in batches of 10 (SQS batch limit)
 */
async function sendMessagesBatch(messages: any[]) {
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize).map((msg, index) => ({
      Id: `${i + index}`, // Unique ID for each message in the batch
      MessageBody: JSON.stringify(msg),
      MessageAttributes: {
        "MessageType": {
          DataType: "String",
          StringValue: "FaceDetection"
        }
      }
    }));

    batches.push(batch);
  }

  let messagesSent = 0;
  for (const batch of batches) {
    try {
      await sqsClient.send(new SendMessageBatchCommand({
        QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/430118859146/faceDetectionQueue',
        Entries: batch
      }));
      messagesSent += batch.length;
    } catch (error) {
      console.error('Error sending batch to SQS:', error);
      throw error;
    }
  }

  return messagesSent;
}

export async function POST(request: Request) {
    // Parse the incoming request body
    const data = await request.json();
    const { userId, eventId, bucketName,rekognitionCollectionId } = data;

    if (!userId || !eventId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          details: 'Both userId and eventId are required'
        },
        { status: 400 }
      );
    }

  try {
    let allFrames: any[] = [];
    let nextToken: string | undefined;
    let pageCount = 0;
    // Fetch all frames using pagination with optimal batch size
    do {
      console.log(`Fetching page ${pageCount + 1} of Frames...`);
    const { data: frames, nextToken: newNextToken } = await client.models.Frames.list({
      filter: {
        and: [
          { userId: { eq: userId } },
          { eventId: { eq: eventId } },
          { isArchived: { ne: true } },
          { recognitionStatus: { ne: 'processed' } },
          {excludeFromFaceDetection: { eq: false }}
        ]
      },
      limit: 100, // Optimal batch size for performance and reliability
      nextToken: nextToken
    });

    if (frames && frames.length > 0) {
      allFrames = allFrames.concat(frames);
      console.log(`Retrieved ${frames.length} Frames in current batch. Total photos: ${allFrames.length}`);
    }
    nextToken = newNextToken||undefined;
      pageCount++;
    } while (nextToken);

    if (allFrames.length === 0) {
      return NextResponse.json({
        success: true,
        messagesSent: 0,
        message: "No frames found to process"
      });
    }
    console.log(`Total frames to process: ${allFrames.length} (retrieved in ${pageCount} pages)`);

    // Prepare message bodies for each frame
    const messages = allFrames.map(frame => ({
      bucketName: bucketName,
      s3Key: frame.s3Key,
      userId: userId,
      eventId: eventId,
      rekognitionCollectionId: rekognitionCollectionId, // Using eventId as collection ID
      sourceType: 'Frames',
      frameId: frame.frameId,
      photoId: null,
      videoId: frame.videoId,
      photosTable: process.env.NEXT_PUBLIC_DYNAMODB_PHOTOS_TABLE_NAME,
      framesTable: process.env.NEXT_PUBLIC_DYNAMODB_FRAMES_TABLE_NAME,
      facesTable: process.env.NEXT_PUBLIC_DYNAMODB_FACES_TABLE_NAME,
      personsTable: process.env.NEXT_PUBLIC_DYNAMODB_PERSONS_TABLE_NAME,
      appSyncEndpoint: process.env.NEXT_PUBLIC_APPSYNC_API_ENDPOINT,
      appSyncApiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY
    }));

    // Send messages in batches
    const messagesSent = await sendMessagesBatch(messages);

    return NextResponse.json({
      success: true,
      messagesSent,
      message: `Successfully queued ${messagesSent} frames for face detection`,
      totalFrames: allFrames.length
    });

  } catch (error) {
    console.error('Error processing frames:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process frames',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}