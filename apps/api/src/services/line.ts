import type { AppConfig } from '../config.js';

interface LineTokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
  refresh_token?: string;
}

interface LineUserInfo {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
}

export const getLineUser = async (
  config: AppConfig,
  code: string,
  redirectUri: string
): Promise<LineUserInfo> => {
  if (config.lineChannelId === 'demo') {
    return {
      sub: `demo-${code}`,
      name: 'LINE เดโม'
    };
  }

  const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.lineChannelId,
      client_secret: config.lineChannelSecret
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('LINE token exchange failed');
  }

  const tokenJson = (await tokenResponse.json()) as LineTokenResponse;

  const userResponse = await fetch('https://api.line.me/oauth2/v2.1/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`
    }
  });

  if (!userResponse.ok) {
    throw new Error('LINE userinfo fetch failed');
  }

  return (await userResponse.json()) as LineUserInfo;
};
