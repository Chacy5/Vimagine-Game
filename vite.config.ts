import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const groqProxy = (apiKey: string) => ({
  name: "groq-proxy",
  configureServer(server: { middlewares: { use: Function } }) {
    server.middlewares.use("/api/groq", async (req: any, res: any) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "GROQ_API_KEY не задан" }));
        return;
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Uint8Array);
      }

      let payload: { prompt?: string; model?: string } = {};
      try {
        const raw = Buffer.concat(chunks).toString("utf-8");
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        // ignore JSON parse errors
      }

      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: payload.model || "llama-3.1-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: "You are a helpful assistant for a kawaii task planner game."
                },
                {
                  role: "user",
                  content: payload.prompt || ""
                }
              ],
              temperature: 0.7
            })
          }
        );

        const data = await response.json();
        const body = data as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = body?.choices?.[0]?.message?.content ?? "";

        res.statusCode = response.status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ content }));
      } catch (error: any) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error: error?.message || "Ошибка при вызове Groq API"
          })
        );
      }
    });
  }
});

const openaiImageProxy = (apiKey: string) => ({
  name: "openai-image-proxy",
  configureServer(server: { middlewares: { use: Function } }) {
    server.middlewares.use("/api/openai-image", async (req: any, res: any) => {
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.end();
        return;
      }

      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "OPENAI_API_KEY не задан" }));
        return;
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Uint8Array);
      }

      let payload: { prompt?: string } = {};
      try {
        const raw = Buffer.concat(chunks).toString("utf-8");
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        // ignore JSON parse errors
      }

      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: payload.prompt || "",
            size: "1024x1024",
            quality: "standard",
            n: 1,
            response_format: "b64_json"
          })
        });

        const data = await response.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (!response.ok || !b64) {
          const errorMessage =
            data?.error?.message || data?.error || "OpenAI image request failed";
          res.statusCode = response.status || 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: errorMessage }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ imageData: `data:image/png;base64,${b64}` }));
      } catch (error: any) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: error?.message || "OpenAI error" }));
      }
    });
  }
});

const openaiChatProxy = (apiKey: string) => ({
  name: "openai-chat-proxy",
  configureServer(server: { middlewares: { use: Function } }) {
    server.middlewares.use("/api/openai-chat", async (req: any, res: any) => {
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.end();
        return;
      }

      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "OPENAI_API_KEY не задан" }));
        return;
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Uint8Array);
      }

      let payload: { prompt?: string; model?: string } = {};
      try {
        const raw = Buffer.concat(chunks).toString("utf-8");
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        // ignore JSON parse errors
      }

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: payload.model || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant for a kawaii task planner game."
              },
              { role: "user", content: payload.prompt || "" }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content ?? "";
        if (!response.ok) {
          const errorMessage =
            data?.error?.message || data?.error || "OpenAI chat request failed";
          res.statusCode = response.status || 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: errorMessage }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ content }));
      } catch (error: any) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: error?.message || "OpenAI error" }));
      }
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/Vimagine-Game/",
    plugins: [
      react(),
      groqProxy(env.GROQ_API_KEY || ""),
      openaiImageProxy(env.OPENAI_API_KEY || ""),
      openaiChatProxy(env.OPENAI_API_KEY || "")
    ]
  };
});
