import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

/* ---------------- OpenAI Client ---------------- */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- Tool ---------------- */

function getWeatherDetails(city = "") {
  const data = {
    karnal: "13°C",
    mohali: "10°C",
    chandigarh: "9°C",
    delhi: "16°C",
    shimla: "4°C",
  };
  return data[city.toLowerCase()] || "Weather data not available";
}

/* ---------------- Tool Schema (IMPORTANT) ---------------- */

const tools = [
  {
    type: "function",
    function: {
      name: "getWeatherDetails",
      description: "Get the temperature of a city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "Name of the city",
          },
        },
        required: ["city"],
      },
    },
  },
];

/* ---------------- System Prompt ---------------- */

const SYSTEM_PROMPT = `
You are an AI agent that follows START, PLAN, ACTION, OBSERVATION, OUTPUT.

Rules:
- Use tools when required.
- Never invent temperature values.
- Use the tool to fetch data.
- After receiving observations, compute the result.
- Respond in polite Indian-style English.
`;

/* ---------------- Agent Loop ---------------- */

async function runAgent(userPrompt) {
  let messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  while (true) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    // If the model wants to call a tool
    if (message.tool_calls) {
      for (const call of message.tool_calls) {
        const toolName = call.function.name;
        const args = JSON.parse(call.function.arguments);

        let result;
        if (toolName === "getWeatherDetails") {
          result = getWeatherDetails(args.city);
        }

        // Add tool observation
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }
    } else {
      // Final output
      messages.push(message);
      console.log("\n✅ FINAL ANSWER:\n");
      console.log(message.content);
      break;
    }
  }
}

/* ---------------- Run ---------------- */

runAgent("Hey, what is sum of temperature of Karnal and Chandigarh?");
