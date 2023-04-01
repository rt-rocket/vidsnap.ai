import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";
import nextSession from "next-session";

const getSession = nextSession();

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

let YouTubeTranscript: string = "Can you help me with something?";

const openai = new OpenAIApi(openaiConfig);

export default async function sendMessage(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session.chatHistory || session.chatHistory === null) {
    session.chatHistory = [
      { role: "system", content: "You are a helpful assistant." }, { role: "user", content: YouTubeTranscript }
    ];
  }

  let prompt: string = req.body.prompt;

  if (!prompt || prompt === "") {
    prompt = "Say Please enter a prompt so I may be able to assist you.";
  }

  session.chatHistory.push({ role: "user", content: `${prompt}` });

  // https://platform.openai.com/docs/api-reference/chat/create
  const completionOutput = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: session.chatHistory,
    temperature: 0.5,
    frequency_penalty: 0.5,
  });

  const completionResponse =
    completionOutput.data.choices[0].message?.content.trim() ||
    "Response missing. Please try again.";

  session.chatHistory.push({
    role: "assistant",
    content: `${completionResponse}`,
  });

  console.log(session.chatHistory)

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ text: completionResponse }));
}
