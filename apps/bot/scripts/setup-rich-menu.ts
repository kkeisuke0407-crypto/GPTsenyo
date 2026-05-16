// LINE Rich Menu セットアップスクリプト
//
// 使い方:
//   LINE_CHANNEL_ACCESS_TOKEN=xxx npx tsx scripts/setup-rich-menu.ts ./rich-menu.png
//
// 引数: Rich Menu の画像 (2500×843px or 2500×1686px, JPEG/PNG, 1MB以下)
//
// レイアウト (2500×1686 を 3列2行に分割):
//   [タロット ] [星占い  ] [数秘    ]
//   [四柱推命 ] [易      ] [プラン  ]

import fs from "node:fs";
import path from "node:path";

const accessToken = process.env["LINE_CHANNEL_ACCESS_TOKEN"];
if (!accessToken) {
  console.error("LINE_CHANNEL_ACCESS_TOKEN env var is required");
  process.exit(1);
}

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Usage: npx tsx scripts/setup-rich-menu.ts <image_path>");
  process.exit(1);
}

const absImagePath = path.resolve(imagePath);
if (!fs.existsSync(absImagePath)) {
  console.error(`Image not found: ${absImagePath}`);
  process.exit(1);
}

const ext = path.extname(absImagePath).toLowerCase();
const contentType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";

const menuDef = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "Selene Main Menu",
  chatBarText: "メニュー",
  areas: [
    { bounds: { x: 0,    y: 0,   width: 833, height: 843 }, action: { type: "message", text: "タロット 今の私に必要なメッセージ" } },
    { bounds: { x: 833,  y: 0,   width: 833, height: 843 }, action: { type: "message", text: "星占い 今月のテーマ" } },
    { bounds: { x: 1666, y: 0,   width: 834, height: 843 }, action: { type: "message", text: "数秘 私の本質" } },
    { bounds: { x: 0,    y: 843, width: 833, height: 843 }, action: { type: "message", text: "四柱推命 今の流れ" } },
    { bounds: { x: 833,  y: 843, width: 833, height: 843 }, action: { type: "message", text: "易 今取るべき道" } },
    { bounds: { x: 1666, y: 843, width: 834, height: 843 }, action: { type: "message", text: "プラン" } },
  ],
};

async function main(): Promise<void> {
  console.log("1/4: 既存のRich Menuを取得...");
  const listRes = await fetch("https://api.line.me/v2/bot/richmenu/list", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) throw new Error(`list failed: ${await listRes.text()}`);
  const { richmenus } = (await listRes.json()) as { richmenus: Array<{ richMenuId: string }> };
  for (const m of richmenus) {
    console.log(`  既存Rich Menuを削除: ${m.richMenuId}`);
    await fetch(`https://api.line.me/v2/bot/richmenu/${m.richMenuId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` },
    });
  }

  console.log("2/4: Rich Menuを作成...");
  const createRes = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(menuDef),
  });
  if (!createRes.ok) throw new Error(`create failed: ${await createRes.text()}`);
  const { richMenuId } = (await createRes.json()) as { richMenuId: string };
  console.log(`  作成完了: ${richMenuId}`);

  console.log("3/4: 画像をアップロード...");
  const imageData = fs.readFileSync(absImagePath);
  const uploadRes = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": contentType,
      },
      body: imageData,
    }
  );
  if (!uploadRes.ok) throw new Error(`upload failed: ${await uploadRes.text()}`);

  console.log("4/4: 全ユーザーのデフォルトに設定...");
  const setDefaultRes = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
    }
  );
  if (!setDefaultRes.ok) throw new Error(`set default failed: ${await setDefaultRes.text()}`);

  console.log(`\n✓ Rich Menu セットアップ完了: ${richMenuId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
