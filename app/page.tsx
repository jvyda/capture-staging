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
  const [MyVideos, setMyVideos] = useState<Array<Schema["MyVideos"]["type"]>>([]);

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  function listMyVideos() {
    client.models.MyVideos.observeQuery().subscribe({
      next: (data) => setMyVideos([...data.items]),
    });
  }
  useEffect(() => {
    listTodos();
    listMyVideos();
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
          <>
          <li key={todo.id}>{todo.content}</li>
          <li key={todo.id}>{todo.name}</li>
          </>
        ))}
      </ul>
      <h1>My videos</h1>
      <ul>
        {MyVideos.map((video) => (
          <>
          <li key={video.id}>{video.videoName}</li>
          </>
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
