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
        const content = data?.choices?.[0]?.message?.content ?? "";

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/Vimagine-Game/",
    plugins: [react(), groqProxy(env.GROQ_API_KEY || "")]
  };
});
