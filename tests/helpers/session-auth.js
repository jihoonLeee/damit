export function readCookiesFromResponse(response) {
  return response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");
}

export function getCookieValue(cookieHeader, name) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

export async function issueChallenge(baseUrl, email, extra = {}) {
  const response = await fetch(`${baseUrl}/api/v1/auth/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...extra })
  });
  return { response, payload: await response.json() };
}

export async function verifyViaLink(baseUrl, debugMagicLink, extra = {}) {
  const magicLink = new URL(debugMagicLink);
  const response = await fetch(`${baseUrl}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId: magicLink.searchParams.get("challengeId"),
      token: magicLink.searchParams.get("token"),
      invitationToken: magicLink.searchParams.get("invitationToken") || undefined,
      ...extra
    })
  });
  return { response, payload: await response.json(), magicLink };
}

export async function createOwnerSession(baseUrl, config, { email, displayName, companyName }) {
  const challenge = await issueChallenge(baseUrl, email);
  const verify = await verifyViaLink(baseUrl, challenge.payload.debugMagicLink, {
    displayName,
    companyName
  });
  const cookieHeader = readCookiesFromResponse(verify.response);
  return {
    challenge,
    verify,
    cookieHeader,
    csrfToken: getCookieValue(cookieHeader, config.csrfCookieName)
  };
}
