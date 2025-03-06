import { generateClient } from "aws-amplify/data";
import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";

// Initialize SQS client
const sqs = new SQSClient({ region: process.env.NEXT_PUBLIC_AWS_REGION });

import type { Schema } from "../../data/resource";
const client = generateClient<Schema>();

export const handler = async (event: { Records: any[] }) => {
  for (const record of event.Records) {
    const { JobId, Status } = JSON.parse(record.body);

    // Find the video or chunk by jobId
    // Find the video or chunk by jobId
    const videoResponse = await client.models.Videos.list({
      filter: { jobId: { eq: JobId } },
      limit: 1,
    });

    const [video] = videoResponse.data;

    const videoChunksResponse = await client.models.VideoChunks.list({
      filter: { jobId: { eq: JobId } },
      limit: 1,
    });

    const [chunk] = videoChunksResponse.data;

    if (video) {
      // Update video status and result
      await client.models.Videos.update({
        videoId: video.videoId,
        videoJobStatus: Status === "SUCCEEDED" ? "COMPLETED" : "FAILED",
        videoJobResult: Status === "SUCCEEDED" ? record.body : null,
      });
    } else if (chunk) {
      // Update chunk status and result
      await client.models.VideoChunks.update({
        chunkId: chunk.chunkId,
        videoJobStatus: Status === "SUCCEEDED" ? "COMPLETED" : "FAILED",
        videoJobResult: Status === "SUCCEEDED" ? record.body : null,
      });
    }

    // Delete the processed SQS message
    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL!,
        ReceiptHandle: record.receiptHandle,
      })
    );
  }
};
