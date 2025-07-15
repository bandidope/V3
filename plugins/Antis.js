const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderClean = senderId.replace(/[^0-9]/g, "");
  const isGroup = chatId.endsWith("@g.us");

  // vCard decorativa
  const fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo"
    },
    message: {
      locationMessage: {
        name: "𝗠𝗢𝗗𝗢 𝗔𝗡𝗧𝗜𝗦",
        jpegThumbnail: await (await fetch("https://iili.io/FCJSFix.jpg")).buffer(),
        vcard:
          "BEGIN:VCARD\n" +
          "VERSION:3.0\n" +
          "N:;Unlimited;;;\n" +
          "FN:Unlimited\n" +
          "ORG:Unlimited\n" +
          "TITLE:\n" +
          "item1.TEL;waid=19709001746:+1 (970) 900-1746\n" +
          "item1.X-ABLabel:Unlimited\n" +
          "X-WA-BIZ-DESCRIPTION:ofc\n" +
          "X-WA-BIZ-NAME:Unlimited\n" +
          "END:VCARD"
      }
    },
    participant: "0@s.whatsapp.net"
  };

  if (!isGroup) {
    return conn.sendMessage(chatId, {
      text: "❌ Este comando solo puede usarse en grupos."
    }, { quoted: fkontak });
  }

  const metadata = await conn.groupMetadata(chatId);
  const participante = metadata.participants.find(p => p.id === senderId);
  const isAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";
  const isOwner = global.owner.some(([id]) => id === senderClean);
  const isFromMe = msg.key.fromMe;

  if (!isAdmin && !isOwner && !isFromMe) {
    return conn.sendMessage(chatId, {
      text: "🚫 Solo los administradores del grupo, el owner o el bot pueden usar este comando."
    }, { quoted: fkontak });
  }

  if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
    return conn.sendMessage(chatId, {
      text: "⚙️ Usa: *antis on/off* para activar o desactivar el sistema."
    }, { quoted: fkontak });
  }

  const activosPath = path.resolve("activos.json");
  let activos = {};
  if (fs.existsSync(activosPath)) {
    activos = JSON.parse(fs.readFileSync(activosPath, "utf-8"));
  }

  if (!activos.antis) activos.antis = {};

  const estado = args[0].toLowerCase() === "on";
  if (estado) {
    activos.antis[chatId] = true;
  } else {
    delete activos.antis[chatId];
  }

  fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));

  const estadoTexto = estado ? "𝖠𝖼𝗍𝗂𝗏𝖺𝖽𝗈" : "𝖣𝖾𝗌𝖺𝖼𝗍𝗂𝗏𝖺𝖽𝗈";
  const funcionTexto = estado
    ? "𝖤𝗅𝗂𝗆𝗂𝗇𝖺 𝗎𝗌𝗎𝖺𝗋𝗂𝗈𝗌 𝗊𝗎𝖾́ 𝗁𝖺𝖼𝖾𝗇 𝖲𝗉𝖺𝗆 nombres 𝖼𝗈𝗇 𝖲𝗍𝗂𝖼𝗄𝖾𝗋s"
    : "𝖤𝗅 𝗌𝗂𝗌𝗍𝖾𝗆𝖺 𝖺𝗇𝗍𝗂𝗌 𝗁𝖺 𝗌𝗂𝖽𝗈 𝖽𝖾𝗍𝖾𝗇𝗂𝖽𝗈";

  const mensaje = `\`「 𝖠𝖼𝖼𝗂𝗈́𝗇 𝗋𝖾𝖺𝗅𝗂𝗓𝖺𝖽𝖺 ✅ 」\`\n\n` +
                  `*│┊➺ 𝖢𝗈𝗆𝖺𝗇𝖽𝗈:* Antis\n` +
                  `*│┊➺ 𝖤𝗌𝗍𝖺𝖽𝗈:* ${estadoTexto}\n` +
                  `*│┊➺ 𝖯𝖺𝗋𝖺:* Este grupo\n` +
                  `*│┊➺ 𝖥𝗎𝗇𝖼𝗂𝗈́𝗇:* ${funcionTexto}\n` +
                  `*╰ ∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙∙ ∙ ∙ ∙ ∙*`;

  await conn.sendMessage(chatId, {
    text: mensaje,
    mentions: [senderId]
  }, { quoted: fkontak });

  await conn.sendMessage(chatId, {
    react: { text: "✅", key: msg.key }
  });
};

handler.command = ["antis"];
module.exports = handler;