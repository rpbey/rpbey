import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import dotenv from "dotenv";
dotenv.config();

const clientId = process.env.TWITCH_CLIENT_ID || "";
const clientSecret = process.env.TWITCH_CLIENT_SECRET || "";

async function listSubs() {
  if (!clientId || !clientSecret) {
    console.log("No creds");
    return;
  }
  const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
  const apiClient = new ApiClient({ authProvider });

  try {
    const subs = await apiClient.eventSub.getSubscriptions();
    console.log("Active Subscriptions:", subs.data.length);
    subs.data.forEach((sub) => {
      console.log(
        `- Type: ${sub.type}, Status: ${sub.status}, Callback: ${
          (sub as any)._transport?.callback
        }`,
      );
    });
  } catch (e) {
    console.error(e);
  }
}

listSubs();
