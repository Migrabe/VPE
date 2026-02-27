// In a real app, you would use a package like node-fetch or axios
// Node 18+ has native fetch

const generatePrompt = async (req, res) => {
  try {
    const { provider, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    let result = "";

    if (provider === "groq") {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "GROQ_API_KEY not configured on server" });
      }

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
          }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Error from Groq API");

      result = data.choices[0]?.message?.content || "";
    } else if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "GEMINI_API_KEY not configured on server" });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Error from Gemini API");

      result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      return res.status(400).json({ message: "Invalid provider specified" });
    }

    res.json({ result });
  } catch (error) {
    console.error("Generation Error:", error);
    res.status(500).json({ message: "Error generating prompt" });
  }
};

const generateVideoPrompt = async (req, res) => {
  try {
    const { provider, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    let result = "";

    if (provider === "groq") {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "GROQ_API_KEY not configured on server" });
      }

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert at creating visual prompts for AI video generators.",
              },
              { role: "user", content: prompt },
            ],
          }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Error from Groq API");

      result = data.choices[0]?.message?.content || "";
    } else if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ message: "GEMINI_API_KEY not configured on server" });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Create a video prompt for AI video generators based on this: ${prompt}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Error from Gemini API");

      result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      return res.status(400).json({ message: "Invalid provider specified" });
    }

    res.json({ result });
  } catch (error) {
    console.error("Video Generation Error:", error);
    res.status(500).json({ message: "Error generating video prompt" });
  }
};

module.exports = {
  generatePrompt,
  generateVideoPrompt,
};
