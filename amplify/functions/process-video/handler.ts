import { generateClient } from 'aws-amplify/data';

import type { Schema } from '../../data/resource';
const client = generateClient<Schema>();

import { RekognitionClient, StartFaceSearchCommand } from '@aws-sdk/client-rekognition';

const rekognition = new RekognitionClient({ region: process.env.NEXT_PUBLIC_AWS_REGION });

export const handler = async (event: { videoId: string, chunkId?: string }) => {
  try {
    const { videoId, chunkId } = event;

    // Fetch video or chunk details
    const video = chunkId 
      ? await client.models.VideoChunks.get({ chunkId })
      : await client.models.Videos.get({ videoId });

    if (!video.data) {
      throw new Error(`Video not found: ${videoId}`);
    }

    const params = {
      Video: {
        S3Object: {
          Bucket: video.data.s3Bucket || undefined,
          Name: video.data.s3Key || undefined
        }
      },
      CollectionId: video.data.recognitionCollectionId || undefined,
      NotificationChannel: {
        SNSTopicArn: process.env.SNS_TOPIC_ARN!,
        RoleArn: process.env.SNS_ROLE_ARN!
      },
      FaceMatchThreshold: 85, // Adjust as needed
      MaxResults: 10 // Adjust as needed
    };

    // Start face search
    const { JobId } = await rekognition.send(new StartFaceSearchCommand(params));

    // Update job status
    if (chunkId) {
      await client.models.VideoChunks.update({
        chunkId,
        jobId: JobId,
        videoJobStatus: 'PROCESSING'
      });
    } else {
      await client.models.Videos.update({
        videoId,
        jobId: JobId,
        videoJobStatus: 'PROCESSING'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing video:', error);
    if (event.chunkId) {
      await client.models.VideoChunks.update({
        chunkId: event.chunkId,
        videoJobStatus: 'FAILED'
      });
    } else {
      await client.models.Videos.update({
        videoId: event.videoId,
        videoJobStatus: 'FAILED'
      });
    }
    return { success: false };
  }
};