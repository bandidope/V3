const fetch = require('node-fetch');

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const text = args.join(" ").trim();

  // Reaccionar al comando
  await conn.sendMessage(chatId, { react: { text: '🎵', key: msg.key } });

  if (!text) {
    return conn.sendMessage(chatId, {
      text:
        `╭─⬣「 *KilluaBot* 」⬣\n` +
        `│ ≡◦ 🎧 *Uso correcto del comando:*\n` +
        `│ ≡◦ .play Anuel perfecto\n` +
        `╰─⬣\n> © ⍴᥆ᥕᥱrᥱძ ᑲᥡ һᥒ ᥴһ᥆ᥣі𝗍᥆`
    }, { quoted: msg });
  }

  try {
    const res = await fetch(`https://api.nekorinn.my.id/downloader/spotifyplay?q=${encodeURIComponent(text)}`);
    const json = await res.json();

    if (!json.status || !json.result?.downloadUrl) {
      return conn.sendMessage(chatId, {
        text:
          `╭─⬣「 *Barboza AI* 」⬣\n` +
          `│ ≡◦ ❌ *No se encontró resultado para:* ${text}\n` +
          `╰─⬣`
      }, { quoted: msg });
    }

    const { title, artist, duration, cover, url } = json.result.metadata;
    const audio = json.result.downloadUrl;

    // Enviar imagen con detalles y la portada ORIGINAL
    await conn.sendMessage(chatId, {
      image: { url: cover }, // ← AQUÍ VA LA PORTADA ORIGINAL
      caption:
        `╭─⬣「 *KILLUA-BOT SPOTIFY* 」⬣\n` +
        `│ ≡◦ 🎵 *Título:* ${title}\n` +
        `│ ≡◦ 👤 *Artista:* ${artist}\n` +
        `│ ≡◦ ⏱️ *Duración:* ${duration}\n` +
        `╰─⬣`
    }, { quoted: msg });

    // Enviar el archivo de audio
    await conn.sendMessage(chatId, {
      audio: { url: audio },
      mimetype: 'audio/mp4',
      ptt: false,
      fileName: `${title}.mp3`
    }, { quoted: msg });

  } catch (e) {
    console.error(e);
    return conn.sendMessage(chatId, {
      text:
        `╭─⬣「 *KilluaBot* 」⬣\n` +
        `│ ≡◦ ⚠️ *Error al procesar la solicitud.*\n` +
        `│ ≡◦ Intenta nuevamente más tarde.\n` +
        `╰─⬣`
    }, { quoted: msg });
  }
};

handler.command = ["rolita"];
handler.tags = ["descargas"];
handler.help = ["spotify <nombre>"];
module.exports = handler;