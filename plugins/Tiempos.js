const fs = require("fs");
const path = require("path");
const axios = require("axios");
const fetch = require("node-fetch");

const tiemposPath = path.resolve("./tiempos.json");

// Imagen de miniatura
const thumbUrl = 'https://iili.io/F0WTiLN.jpg';

function formatearFecha(fecha) {
  const date = new Date(fecha);
  return date.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatearDiaCompleto(fecha) {
  const date = new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "2-digit",
    month: "long"
  });
}

function calcularDiasRestantes(fechaFutura) {
  const hoy = new Date();
  return Math.ceil((fechaFutura - hoy) / (1000 * 60 * 60 * 24));
}

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");
  const senderId = isGroup ? (msg.key.participant || msg.participant || msg.key.remoteJid) : msg.key.remoteJid;
  const senderNum = senderId.split('@')[0];
  const command = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

  const OWNERS = ["31375424024748", "50489513153"];
  const isOwner = OWNERS.includes(senderNum);

  let metadata = null;
  let participant = null;
  let isAdmin = false;

  if (isGroup) {
    try {
      metadata = await conn.groupMetadata(chatId);
      participant = metadata.participants.find(p => p.id === senderId);
      isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
    } catch (e) {
      console.error("Error al obtener metadata del grupo:", e.message);
    }
  }

  const tiempos = fs.existsSync(tiemposPath) ? JSON.parse(fs.readFileSync(tiemposPath)) : {};

  // Contacto decorativo estilo Izumi (con miniatura)
  const thumb = await (await fetch(thumbUrl)).buffer();
  const fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo"
    },
    message: {
      locationMessage: {
        name: "𝗚𝗥𝗔𝗖𝗜𝗔𝗦 𝗣𝗢𝗥 𝗖𝗢𝗡𝗧𝗥𝗔𝗧𝗔𝗥𝗠𝗘",
        jpegThumbnail: thumb,
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

  // .tiempos <días>
  if (command.startsWith(".tiempos")) {
    if (!isOwner) return conn.sendMessage(chatId, { text: "🚫 *Solo el owner puede usar este comando.*" }, { quoted: msg });

    const dias = parseInt(args[0]);
    if (isNaN(dias) || dias <= 0) {
      return conn.sendMessage(chatId, {
        text: "⚠️ Especifica un número válido de días. Ejemplo: *.tiempos 30*"
      }, { quoted: msg });
    }

    const fechaActual = Date.now();
    const fechaFin = fechaActual + dias * 24 * 60 * 60 * 1000;
    tiempos[chatId] = { inicio: fechaActual, fin: fechaFin };
    fs.writeFileSync(tiemposPath, JSON.stringify(tiempos, null, 2));

    return conn.sendMessage(chatId, {
      text: `➤ \`ORDENES RECIBIDAS\` ✅\n\n\`\`\`Finaliza en: ${dias} días.\`\`\`\n\`\`\`Fecha: ${formatearFecha(fechaFin)}\`\`\`\n\`\`\`Grupo: ${metadata?.subject || "Grupo desconocido"}\`\`\`\n\n> 𝖴𝗌𝖾 .𝗏𝖾𝗋𝖿𝖾𝖼𝗁𝖺`
    }, { quoted: fkontak });
  }

  // .verfecha
  if (command.startsWith(".verfecha")) {
    if (!isOwner && !isAdmin) {
      return conn.sendMessage(chatId, {
        text: "🚫 *Solo los administradores y el owner pueden usar este comando.*"
      }, { quoted: msg });
    }

    if (!tiempos[chatId]) {
      return conn.sendMessage(chatId, {
        text: "❌ No se ha establecido ningún tiempo para este grupo."
      }, { quoted: msg });
    }

    const { fin } = tiempos[chatId];
    const diasRestantes = calcularDiasRestantes(fin);
    const fechaTexto = formatearDiaCompleto(fin);
    const horaTexto = formatearFecha(fin).split(", ")[1];

    return conn.sendMessage(chatId, {
      text: `📅 \`SHOWDATE\` 🔔\n\n\`\`\`Próximo ${fechaTexto}\`\`\`\n\`\`\`Hora exacta: ${horaTexto} (hora CDMX)\`\`\`\n\`\`\`Quedan, ${diasRestantes} días.\`\`\`\n\n> 𝖴𝗌𝖾 .𝗋𝖾𝗇𝗈𝗏𝖺𝗋`
    }, { quoted: fkontak });
  }

  // .renovar
  if (command.startsWith(".renovar")) {
    if (!isOwner && !isAdmin) {
      return conn.sendMessage(chatId, {
        text: "🚫 *Solo los administradores y el owner pueden usar este comando.*"
      }, { quoted: msg });
    }

    const ownersInfo = [
      { name: "Cholito", number: "50489513153" },
      { name: "Support", number: "31375424024748" }
    ];

    const contacts = ownersInfo.map(o => ({
      displayName: o.name,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${o.name}\nTEL;type=CELL;type=VOICE;waid=${o.number}:${o.number}\nEND:VCARD`
    }));

    return conn.sendMessage(chatId, { contacts }, { quoted: fkontak });
  }
};

handler.command = ["tiempos", "verfecha", "renovar"];
handler.tags = ["tools"];
handler.help = [".tiempos <días>", ".verfecha", ".renovar"];

module.exports = handler;