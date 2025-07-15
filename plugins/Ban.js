const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderNum = senderId.replace(/[^0-9]/g, "");
  const isGroup = chatId.endsWith("@g.us");
  const isOwner = global.owner.some(([id]) => id === senderNum);

  if (!isGroup) {
    return conn.sendMessage(chatId, {
      text: "📛 *Este comando solo está disponible en grupos.*",
    }, { quoted: msg });
  }

  const metadata = await conn.groupMetadata(chatId);
  const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin;

  if (!isAdmin && !isOwner) {
    return conn.sendMessage(chatId, {
      text: "🚫 *Permiso denegado*\nSolo los *admins* o el *dueño del bot* pueden usar este comando.",
    }, { quoted: msg });
  }

  const context = msg.message?.extendedTextMessage?.contextInfo;
  const mentionedJid = context?.mentionedJid || [];

  let target = null;

  // Opción 1: si responde al mensaje
  if (context?.participant) {
    target = context.participant;
  }
  // Opción 2: si menciona a alguien con @
  else if (mentionedJid.length > 0) {
    target = mentionedJid[0];
  }

  if (!target) {
    return conn.sendMessage(chatId, {
      text: "📍 *Debes responder al mensaje o mencionar con @ al usuario que deseas banear.*",
    }, { quoted: msg });
  }

  const targetNum = target.replace(/[^0-9]/g, "");
  if (global.owner.some(([id]) => id === targetNum)) {
    return conn.sendMessage(chatId, {
      text: "❌ *No puedes banear al dueño del bot.*",
    }, { quoted: msg });
  }

  const banPath = path.resolve("./ban.json");
  const banData = fs.existsSync(banPath) ? JSON.parse(fs.readFileSync(banPath)) : {};
  if (!banData[chatId]) banData[chatId] = [];

  if (!banData[chatId].includes(target)) {
    banData[chatId].push(target);
    fs.writeFileSync(banPath, JSON.stringify(banData, null, 2));

    await conn.sendMessage(chatId, {
      text:
`🚫 *El usuario ha sido baneado del grupo.*

╭─⬣「 *Usuario Baneado* 」⬣
│ 👤 Usuario: @${target.split("@")[0]}
│ 🔒 Estado: Baneado
╰─⬣`,
      mentions: [target]
    }, { quoted: msg });

  } else {
    await conn.sendMessage(chatId, {
      text:
`⚠️ *Este usuario ya está baneado.*

╭─⬣「 *Ya Baneado* 」⬣
│ 👤 Usuario: @${target.split("@")[0]}
│ 🔒 Estado: Baneado
╰─⬣`,
      mentions: [target]
    }, { quoted: msg });
  }
};

handler.command = ["ban"];
module.exports = handler;