function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function createPkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  return { verifier, challenge };
}
export function googleAuthorizeUrl(projectUrl, redirectUrl, challenge) {
  const url = new URL('/auth/v1/authorize', projectUrl);
  if (url.protocol !== 'https:') throw new Error('Invalid account service URL');
  url.search = new URLSearchParams({ provider: 'google', redirect_to: redirectUrl,
    code_challenge: challenge, code_challenge_method: 's256' }).toString();
  return url.href;
}
export function customerSession(data) {
  if (!data?.access_token || !data.user?.id) throw new Error('Sign-in did not return a customer session');
  return { access_token: data.access_token, refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now()/1000) + Number(data.expires_in || 3600),
    user: { id: data.user.id, email: data.user.email, full_name: data.user.user_metadata?.full_name || '', username: data.user.user_metadata?.username || '' } };
}
