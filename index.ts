import { Agent, CredentialSession } from "@atproto/api";
import { configDotenv } from "dotenv";
import path from "node:path";
import fs from "node:fs";

configDotenv();

const session = new CredentialSession(new URL("https://bsky.social"));

const agent = new Agent(session);

async function main() {
  const file = fs.readFileSync(path.join(__dirname, "image.png"));

  const blob = new Blob([file.buffer]);

  await session.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });

  const response = await agent.uploadBlob(blob);
  console.log(response);
  const result = await agent.post({
    text: "Teste",
    embed: {
      images: [{ image: response.data.blob, alt: "Teste", $type: "app.bsky.embed.images#image" }],
      $type: "app.bsky.embed.images"
    },
  });

  console.log(result)
}

main();

