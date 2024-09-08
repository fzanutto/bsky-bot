import { Agent, CredentialSession } from "@atproto/api";
import { configDotenv } from "dotenv";
import path from "node:path";
import fs from "node:fs";

configDotenv();

const session = new CredentialSession(new URL("https://bsky.social"));

const agent = new Agent(session);

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getFileData() {
  const frames = fs.readdirSync(path.join(__dirname, "frames"));
  const nextFrame = frames[0];
  const lastFrame = frames[frames.length - 1];

  const season = nextFrame.slice(1, 3);
  const episode = nextFrame.slice(4, 6);
  const currentFrameNumber = parseInt(nextFrame.slice(7, 11));
  const totalFrames = lastFrame.slice(7, 11);

  const file = fs.readFileSync(path.join(__dirname, "frames", nextFrame));

  const blob = new Blob([file.buffer]);
  return { season, episode, currentFrameNumber, totalFrames, blob, nextFrame };
}

async function login() {
  await session.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });
}

async function sendPost() {
  const { season, episode, currentFrameNumber, totalFrames, blob, nextFrame } =
    await getFileData();

  const response = await agent.uploadBlob(blob);

  const postText = `Temporada ${season} Episódio ${episode} - Frame ${currentFrameNumber} de ${totalFrames}`;

  await agent.post({
    text: postText,
    embed: {
      images: [
        {
          image: response.data.blob,
          alt: postText,
          $type: "app.bsky.embed.images#image",
        },
      ],
      $type: "app.bsky.embed.images",
    },
  });

  fs.unlinkSync(path.join(__dirname, "frames", nextFrame));

  console.log(postText);
}

async function main() {
  while (true) {
    try {
      await login();
      await sendPost();
      await sendPost();
      await sendPost();
      await session.logout();
    } catch (error) {
      console.log(error);
    }

    console.log("Waiting 15 minutes...", new Date());
    await sleep(1000 * 60 * 15);
  }
}

main();

// ffmpeg -r 1 -i .\s01e01.mp4 -r 1 "s01e01_%04d.png"
// ffmpeg -i s01e01.mp4 -r 3 output.mp4
// ffmpeg -i .\s01e01.mp4 -c copy -an output.mp4
