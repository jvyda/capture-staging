// utils/processVideoFunction.ts
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
const client = generateClient<Schema>();

import { RekognitionClient, StartFaceSearchCommand } from '@aws-sdk/client-rekognition';

const rekognition = new RekognitionClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID||'',
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY||'',
    }
  });

export const processVideoFunction = async (video: {
  videoId: string;
  chunkId?: string;
  bucket: string;
  s3Key: string;
  collectionId: string;
}) => {
  try {
    const params = {
      Video: {
        S3Object: {
          Bucket: video.bucket,
          Name: video.s3Key
        }
      },
      CollectionId: video.collectionId, // Replace with your collection ID
      NotificationChannel: {
        SNSTopicArn: process.env.NEXT_PUBLIC_SNS_TOPIC_ARN!,
        RoleArn: process.env.NEXT_PUBLIC_SNS_ROLE_ARN!
      },
      FaceMatchThreshold: 85, // Adjust as needed
      MaxResults: 10 // Adjust as needed
    };

    // Start face search
    const { JobId } = await rekognition.send(new StartFaceSearchCommand(params));

    // Update job status
    if (video.chunkId) {
      await client.models.VideoChunks.update({
        chunkId: video.chunkId,
        jobId: JobId,
        videoJobStatus: 'PROCESSING'
      });
    } else {
      await client.models.Videos.update({
        videoId: video.videoId,
        jobId: JobId,
        videoJobStatus: 'PROCESSING'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing video:', error);
    if (video.chunkId) {
      await client.models.VideoChunks.update({
        chunkId: video.chunkId,
        videoJobStatus: 'FAILED'
      });
    } else {
      await client.models.Videos.update({
        videoId: video.videoId,
        videoJobStatus: 'FAILED'
      });
    }
    return { success: false };
  }
};