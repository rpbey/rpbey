import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const accessToken = 'uxvuo2zn1fh2ir27wuzz7kazbmjvns';
const refreshToken = '4o2whcifqtuz8p7z5nk8ejut0qnrdfjqr4hw6v2a2gy6oujipd';

async function test() {
  const authProvider = new RefreshingAuthProvider({ clientId, clientSecret });
  const userId = await authProvider.addUserForToken({
    accessToken,
    refreshToken,
    expiresIn: 0,
    obtainmentTimestamp: Date.now()
  });

  const apiClient = new ApiClient({ authProvider });
  try {
    const user = await apiClient.users.getAuthenticatedUser(userId);
    console.log('Token is valid for user:', user.displayName);
  } catch (e) {
    console.error('Token validation failed:', e.message);
  }
}

test();
