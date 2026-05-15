export type QuickReplyItem = {
  type: "action";
  action:
    | { type: "postback"; label: string; data: string; displayText?: string }
    | { type: "message"; label: string; text: string }
    | { type: "uri"; label: string; uri: string };
};

export type LineMessage =
  | { type: "text"; text: string; quickReply?: { items: QuickReplyItem[] } }
  | { type: "flex"; altText: string; contents: unknown };

export async function replyMessage(
  accessToken: string,
  replyToken: string,
  messages: LineMessage[]
): Promise<void> {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE reply failed ${res.status}: ${body}`);
  }
}

export async function pushMessage(
  accessToken: string,
  to: string,
  messages: LineMessage[]
): Promise<void> {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE push failed ${res.status}: ${body}`);
  }
}

export async function multicastMessage(
  accessToken: string,
  to: string[],
  messages: LineMessage[]
): Promise<void> {
  if (to.length === 0) return;
  // LINE Multicast: 最大500件/コール
  for (let i = 0; i < to.length; i += 500) {
    const chunk = to.slice(i, i + 500);
    const res = await fetch("https://api.line.me/v2/bot/message/multicast", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ to: chunk, messages }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`LINE multicast failed ${res.status}: ${body}`);
    }
  }
}

export async function verifyLineSignature(
  channelSecret: string,
  body: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return timingSafeEqual(expected, signatureHeader);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
