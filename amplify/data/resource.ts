import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      name: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Users: a
    .model({
      userId: a.id(),
      name: a.string(),
      phoneNumber: a.string(),
      email: a.string(),
      emailVerified: a.boolean(),
      subscriptionPlan: a.string(),
      subscriptionStatus: a.string(),
      createdAt: a.timestamp(),
      updatedAt: a.timestamp(),
      storageAllocated: a.float(),
      storageUsed: a.float(),
      framesTotal: a.integer(),
      framesProcessed: a.integer(),
      photosTotal: a.integer(),
      photosProcessed: a.integer(),
      videosTotal: a.integer(),
      videosProcessed: a.integer(),
      role: a.string(),
      totalEvents: a.integer(),
      events: a.hasMany('Events', 'userId') // Links to the 'userId' field in Events
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Events: a
    .model({
      eventId: a.id(), // mark as partition key
      eventName: a.string(),
      description: a.string(),
      eventDate: a.timestamp(),
      Venue: a.string(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zip: a.string(),
      country: a.string(),
      createdAt: a.timestamp(),
      updatedAt: a.timestamp(),
      userId: a.string(),
      type: a.string(),
      message: a.string(),
      user: a.belongsTo('Users', 'userId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Videos: a
    .model({
      videoId: a.id(), // mark as partition key
      createdAt: a.timestamp(),
      videoName: a.string(),
      hasChunks: a.boolean(),
      chunksCount: a.integer(),
      videoChunks: a.hasMany('VideoChunks', 'videoId') // Links to the 'videoId' field in VideoChunks
    })
    .authorization((allow) => [allow.publicApiKey()]),

  VideoChunks: a
    .model({
      chunkId: a.id(), //  mark as partition key
      createdAt: a.timestamp(),
      chunkName: a.string(),
      hasChunks: a.boolean(),
      videoId: a.string(),
      videoChunk: a.belongsTo('Videos', 'videoId')
    })
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
