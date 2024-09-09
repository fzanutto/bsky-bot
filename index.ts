import { Agent, CredentialSession } from "@atproto/api";
import { configDotenv } from "dotenv";
import path from "node:path";
import fs from "node:fs";

configDotenv({
  path: path.join(__dirname, ".env"),
});

const session = new CredentialSession(new URL("https://bsky.social"));
const agent = new Agent(session);

const WARN_FRAMES_THRESHOLD = 100;
const FRAMES_PER_ITERATION = 3;

async function warnAboutFewFrames() {
  const frames = fs.readdirSync(path.join(__dirname, "frames"));
  if (frames.length < WARN_FRAMES_THRESHOLD) {
    await sendMessage(
      `Menos de ${WARN_FRAMES_THRESHOLD} frames no diretório. (${frames.length})`
    );
  }
}

async function getFileData() {
  const frames = fs.readdirSync(path.join(__dirname, "frames")).sort((a, b) => {
    const seasonA = a.slice(1, 3);
    const episodeA = a.slice(4, 6);
    const frameA = a.slice(7, 11);
    const seasonB = b.slice(1, 3);
    const episodeB = b.slice(4, 6);
    const frameB = b.slice(7, 11);
    return (
      seasonA.localeCompare(seasonB) ||
      episodeA.localeCompare(episodeB) ||
      frameA.localeCompare(frameB)
    );
  });

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

export async function login() {
  await session.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });
}

async function sendMessage(text: string) {
  const proxy = agent.withProxy("bsky_chat", "did:web:api.bsky.chat");
  const convo = await proxy.chat.bsky.convo.getConvoForMembers({
    members: [process.env.USER_DID!],
  });

  return proxy.chat.bsky.convo.sendMessage({
    convoId: convo.data.convo.id,
    message: { text },
  });
}

async function sendPost() {
  const { season, episode, currentFrameNumber, totalFrames, blob, nextFrame } =
    await getFileData();

  const response = await agent.uploadBlob(blob);

  const postText = `Temporada ${season} Episódio ${episode} - Frame ${currentFrameNumber}`;

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
  try {
    await login();
    for (let i = 0; i < FRAMES_PER_ITERATION; i++) {
      await sendPost();
    }
    await warnAboutFewFrames();
  } catch (error) {
    console.log(error);
    await sendMessage((error as Error).toString());
  } finally {
    await session.logout();
  }

  console.log("Waiting until next post...", new Date());
}

main();

// ffmpeg -r 1 -i .\s01e01.mp4 -r 1 "s01e01_%04d.png"
// ffmpeg -i s01e01.mp4 -r 3 output.mp4
// ffmpeg -i .\s01e01.mp4 -c copy -an output.mp4
