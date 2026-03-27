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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_API_KEY не задан" });
    return;
  }

  const { prompt, model } = req.body || {};

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
          model: model || "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant for a kawaii task planner game."
            },
            { role: "user", content: prompt || "" }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    res.status(response.status).json({ content });
  } catch (error) {
    res.status(500).json({
      error: error?.message || "Ошибка при вызове Groq API"
    });
  }
}
