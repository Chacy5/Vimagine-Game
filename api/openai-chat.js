export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY не задан" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { prompt, model } = body || {};
  if (!prompt) {
    res.status(400).json({ error: "Prompt обязателен" });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for a kawaii task planner game."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    if (!response.ok) {
      const errorMessage =
        data?.error?.message || data?.error || "OpenAI chat request failed";
      res.status(response.status).json({ error: errorMessage });
      return;
    }

    res.status(200).json({ content });
  } catch (error) {
    res.status(500).json({
      error: error?.message || "Ошибка при вызове OpenAI Chat"
    });
  }
}
