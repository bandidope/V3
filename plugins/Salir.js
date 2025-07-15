const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const jid = msg.participant || msg.key.participant || msg.key.remoteJid;
  const senderNum = jid.split('@')[0]; // ← Solo el número
  const senderMention = `@${senderNum}`;
  const mentionJid = jid; // ← El JID real

  if (!global.owner.some(([id]) => id === senderNum)) {
    return conn.sendMessage(chatId, {
      text: "❌ Solo el *owner* del bot puede usar este comando."
    }, { quoted: msg });
  }

  const numero = args[0];
  if (!numero || isNaN(numero)) {
    return conn.sendMessage(chatId, {
      text: '⚠️ Debes escribir el número del grupo.\n\nEjemplo: *.salir 2*'
    }, { quoted: msg });
  }

  const grupo = (global.gruposAdmin || []).find(g => g.code === numero);

  if (!grupo) {
    return conn.sendMessage(chatId, {
      text: '❌ No se encontró el grupo con ese número.\nUsa *.listarsalir* para ver los disponibles.'
    }, { quoted: msg });
  }

  try {
    const botName = conn.user.name || 'KilluaBot';

    const salidaTexto = `
╭━━〔 🚪 *${botName} se despide* 〕━━⬣
┃
┃ ⚠️ *Motivo:* El owner principal solicitó la salida
┃ 🏷️ *Grupo:* ${grupo.name}
┃ 👤 *Solicitado por:* ${senderMention}
┃
┃ 🛑 ${botName} ha abandonado este grupo.
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

    await conn.sendMessage(grupo.id, {
      text: salidaTexto,
      mentions: [mentionJid] // Enlaza el @502... con el JID real
    });

    await conn.groupLeave(grupo.id);

    return conn.sendMessage(chatId, {
      text: `✅ ${botName} ha salido del grupo *${grupo.name}* por tu orden.`,
      mentions: [mentionJid]
    }, { quoted: msg });

  } catch (e) {
    console.error(e);
    return conn.sendMessage(chatId, {
      text: '❌ No se pudo salir del grupo. ¿Soy admin?'
    }, { quoted: msg });
  }
};

handler.command = ['salir'];
module.exports = handler;