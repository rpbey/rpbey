import dotenv from "dotenv";
dotenv.config();

console.log("DEBUG: TWITCH_CLIENT_ID:", process.env.TWITCH_CLIENT_ID);
console.log(
  "DEBUG: TWITCH_CLIENT_SECRET:",
  process.env.TWITCH_CLIENT_SECRET ? "******" : "MISSING",
);

import { getRPBStreamInfo, getLatestRPBVideo } from "../src/lib/twitch";

async function check() {
  console.log("Checking Twitch API Status...");
  try {
    const streamInfo = await getRPBStreamInfo();
    console.log("Stream Info:", streamInfo ? "Online/Found" : "Offline/Not Found (or null)");
    if (streamInfo) console.log(JSON.stringify(streamInfo, null, 2));

    const video = await getLatestRPBVideo();
    console.log("Latest Video:", video ? "Found" : "Not Found");
    if (video) console.log(JSON.stringify(video, null, 2));
  } catch (e) {
    console.error("Error checking Twitch:", e);
  }
}

check();
