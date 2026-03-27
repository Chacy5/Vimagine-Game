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

  const { prompt } = body || {};
  if (!prompt) {
    res.status(400).json({ error: "Prompt обязателен" });
    return;
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
        prompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
        response_format: "b64_json"
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage =
        data?.error?.message || data?.error || "OpenAI image request failed";
      res.status(response.status).json({ error: errorMessage });
      return;
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      res.status(500).json({ error: "Пустой ответ от OpenAI" });
      return;
    }

    res.status(200).json({ imageData: `data:image/png;base64,${b64}` });
  } catch (error) {
    res.status(500).json({
      error: error?.message || "Ошибка при вызове OpenAI Images"
    });
  }
}
