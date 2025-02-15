import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({

  Users: a
    .model({
      userId: a.string().required(),
      name: a.string(),
      email: a.string(),
      emailVerified: a.boolean(),
      framesProcessed: a.integer(),
      framesTotal: a.integer(),
      phoneNumber: a.string(),
      photosProcessed: a.integer(),
      photosTotal: a.integer(),
      role: a.string(),
      storageAllocated: a.float(),
      storageUsed: a.float(),
      subscriptionPlan: a.string(),
      subscriptionStatus: a.string(),
      totalEvents: a.integer(),
      videosProcessed: a.integer(),
      videosTotal: a.integer(),
      events: a.hasMany('Events', 'userId') // Links to the 'userId' field in Events
    })
    .identifier(['userId'])
    .authorization((allow) => [allow.publicApiKey()]),
  Events: a
    .model({
      eventId: a.string().required(), // mark as partition key
      address: a.string(),
      city: a.string(),
      country: a.string(),
      eventDate: a.string(),
      eventDescription: a.string(),
      eventName: a.string(),
      eventVenue: a.string(),
      framesProcessed: a.integer(),
      framesTotal:a.integer(),
      isArchived: a.boolean(),
      noOfGuests: a.integer(),
      peopleTagged: a.integer(),
      photosProcessed: a.integer(),
      photosTotal: a.integer(),
      postalCode: a.string(),
      rekognitionCollectionId: a.string(),
      state: a.string(),
      storageUsed: a.float(),
      userId: a.string(),
      videosProcessed: a.integer(),
      videosTotal: a.integer(),
      coverImage: a.string(),
      eventStatus: a.string(),
      user: a.belongsTo('Users', 'userId')
    })
    .identifier(['eventId'])
    .authorization((allow) => [allow.publicApiKey()]),
  Videos: a
    .model({
      videoId: a.string().required(), // mark as partition key
      chunksCount: a.integer(),
      duration: a.float(),
      eventId: a.string(),
      fileName: a.string(),
      filePath: a.string(),
      fileSize:a.float(),
      hasChunks: a.boolean(),
      isArchived: a.boolean(),
      recognitionCollectionId: a.string(),
      recognitionStatus: a.string(),
      s3Bucket: a.string(),
      s3Key: a.string(),
      taggedFaces: a.json(),
      taggedPeople: a.json(),
      taggedPeopleCount: a.integer(),
      thumbnail: a.string(),
      userId: a.string(),
      videoName: a.string(),
      videoStatus: a.string(),
      videoChunks: a.hasMany('VideoChunks', 'videoId'),
      people: a.hasMany('Persons', 'videoId') // Links to the 'videoId' field in VideoChunks
    })
    .identifier(['videoId'])
    .authorization((allow) => [allow.publicApiKey()]),

  VideoChunks: a
    .model({
      chunkId: a.id(), //  mark as partition key
      userId: a.string(),
      eventId: a.string(),
      fileName:a.string(),
      filePath:a.string(),
      fileSize:a.float(),
      chunkName: a.string(),
      chunkNumber:a.integer(),
      duration: a.float(),
      videoId: a.string(),
      isArchived:a.boolean(),
      s3Bucket:a.string(),
      s3Key:a.string(),
      taggedPeopleCount:a.integer(),
      taggedPeople:a.json(),
      taggedFacesCount:a.integer(),
      taggedFaces:a.json(),
      thumbnail:a.string(),
      recognitionStatus:a.string(),
      recognitionCollectionId:a.string(),
      videoChunk: a.belongsTo('Videos', 'videoId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Frames: a
    .model({
      frameId: a.string().required(),
      aspectRatio: a.float(),
      eventId: a.string(),
      excludeFromFaceDetection: a.boolean(),
      facesExtracted: a.boolean(),
      fileName:a.string(),
      filePath:a.string(),
      fileSize:a.float(),
      frameName:a.string(),
      imageHeight:a.integer(),
      imageWidth:a.integer(),
      isArchived:a.boolean(),
      recognitionCollectionId:a.string(),
      recognitionStatus:a.boolean(),
      s3Bucket:a.string(),
      s3Key:a.string(),
      taggedFaces:a.json(),
      taggedFacesCount:a.integer(),
      taggedPeople:a.json(),
      taggedPeopleCount:a.integer(),
      thumbnail:a.string(),	
      userId: a.string(),
      videoId: a.string()
    })
    .identifier(['frameId'])
    .authorization((allow) => [allow.publicApiKey()]),
    Photos: a
    .model({
      photoId: a.string().required(),
      aspectRatio: a.float(),
      eventId: a.string(),
      excludeFromFaceDetection: a.boolean(),
      facesExtracted: a.boolean(),
      fileName:a.string(),
      filePath:a.string(),
      fileSize:a.float(),
      frameName:a.string(),
      imageHeight:a.integer(),
      imageWidth:a.integer(),
      isArchived:a.boolean(),
      recognitionCollectionId:a.string(),
      recognitionStatus:a.string(),
      s3Bucket:a.string(),
      s3Key:a.string(),
      taggedFaces:a.json(),
      taggedFacesCount:a.integer(),
      taggedPeople:a.json(),
      taggedPeopleCount:a.integer(),
      thumbnail:a.string(),	
      userId: a.string(),
      videoId: a.string()
    })
    .identifier(['photoId'])
    .authorization((allow) => [allow.publicApiKey()]),
    Faces: a
    .model({
      faceId: a.string().required(),
      awsFaceId: a.string(),
      beard: a.boolean(),
      boundingBox: a.json(),
      collectionId: a.string(),
      confidence: a.float(),
      emotionAngry: a.float(),
      emotionCalm: a.float(),
      emotionConfused: a.float(),
      emotionDisgusted: a.float(),
      emotionFear: a.float(),
      emotionHappy: a.float(),
      emotionSad: a.float(),
      emotionSurprised: a.float(),
      eventId: a.string(),
      eyeglasses: a.boolean(),
      eyesOpen:a.boolean(),
      faceImage: a.string(),
      gender: a.string(),
      isArchived: a.boolean(),
      landmarks: a.json(),
      mouthOpen: a.boolean(),
      mustache: a.boolean(),
      personId: a.string(),
      photoId: a.string(),
      frameId: a.string(),
      posePitch: a.float(),
      poseRoll: a.float(),
      poseYaw: a.float(),
      qualityScore: a.float(),
      smile: a.boolean(),
      sourceImage: a.string(),
      sunglasses: a.boolean(),
      userId: a.string()
    })
    .identifier(['faceId'])
    .authorization((allow) => [allow.publicApiKey()]),
    
    Persons: a
    .model({
      personId: a.string().required(),
      age: a.string(),
      allowFaceRecognition: a.boolean(),
      email: a.string(),
      emotion: a.string(),
      eventId: a.string(),
      gender: a.string(),
      isArchived: a.boolean(),
      name: a.string(),
      parentPhotoId: a.string(),
      personName: a.string(),
      phoneNumber: a.string(),
      photoProcessed: a.boolean(),
      processedAt: a.timestamp(),
      sourceType: a.string(),
      thumbnail: a.string(),
      updatedAt: a.timestamp(),
      userId: a.string(),
      videoId: a.string(),
      video: a.belongsTo('Videos', 'videoId')
    })
    .identifier(['personId'])
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
