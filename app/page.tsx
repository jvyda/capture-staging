"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [videos, setVideos] = useState<Array<Schema["Videos"]["type"]>>([]);
  const [videoName, setVideoName] = useState<string>("");

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  function listVideos() {
    client.models.Videos.observeQuery().subscribe({
      next: (data) => setVideos([...data.items]),
    });
  }
  const createVideo = () => {
    client.models.Videos.create({
      videoName,
      hasChunks: false,
    });
  }
  useEffect(() => {
    listTodos();
    listVideos()
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
      name: 'rambo',
    });
  }

  return (
    <main>
    <h1>My todos</h1>
    <button onClick={createTodo}>+ new</button>
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          {todo.content} - {todo.name}
        </li>
      ))}
    </ul>
    <h1>My videos</h1>
    <input type="text" value={videoName} onChange={(e) => setVideoName(e.target.value)} />
    <button onClick={createVideo}>+ new</button>
    <ul>
      {videos.map((video) => (
        <li key={video.videoId}>{video.videoName}</li>
      ))}
    </ul>
    <div>
      🥳 App successfully hosted. Try creating a new todo.
      <br />
      <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
        Review next steps of this tutorial.
      </a>
    </div>
  </main>
  );
}
