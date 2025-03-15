import { NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { processVideo } from '@/amplify/functions/process-video/handler'; // Import the processVideo function

const client = generateClient<Schema>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, chunkId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId' },
        { status: 400 }
      );
    }

    // Call the process-video handler
    const result = await processVideo({ videoId, chunkId });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}
