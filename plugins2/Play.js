const yts = require('yt-search');
const fs = require('fs');
const axios = require('axios');
const Jimp = require('jimp'); // npm i jimp

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const MAX_RETRIES = 2;
const TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 12000;

function isUserBlocked(userId) {
  try {
    const blockedUsers = JSON.parse(fs.readFileSync('./bloqueados.json', 'utf8'));
    return blockedUsers.includes(userId);
  } catch {
    return false;
  }
}

async function getDownloadUrl(videoUrl) {
  const apis = [
    {
      url: `https://api.vreden.my.id/api/ytmp3?url=`,
      type: 'vreden'
    },
    {
      url: `https://api.anhdev.eu.org/api/ytmp3?url=`,
      type: 'anh'
    },
    {
      url: `https://api.lolhuman.xyz/api/ytaudio?apikey=TuAPIKEY&url=`,
      type: 'lolhuman'
    },
    {
      url: `https://bx-team-api.up.railway.app/api/download/youtube-mp3?url=`,
      type: 'bx'
    }
  ];

  for (const api of apis) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get(`${api.url}${encodeURIComponent(videoUrl)}`, { timeout: TIMEOUT_MS });

        switch (api.type) {
          case 'vreden':
            if (response.data?.status === 200 && response.data?.result?.download?.url) {
              return {
                url: response.data.result.download.url.trim(),
                title: response.data.result.metadata.title
              };
            }
            break;
          case 'anh':
            if (response.data?.status && response.data.result?.url) {
              return {
                url: response.data.result.url,
                title: response.data.result.title || 'Audio'
              };
            }
            break;
          case 'lolhuman':
            if (response.data?.status === 200 && response.data.result?.link) {
              return {
                url: response.data.result.link,
                title: response.data.result.title
              };
            }
            break;
          case 'bx':
            if (response.data?.success && response.data?.data?.url) {
              return {
                url: response.data.data.url,
                title: response.data.data.title
              };
            }
            break;
        }
      } catch {
        if (attempt < MAX_RETRIES - 1) await wait(RETRY_DELAY_MS);
      }
    }
  }
  return null;
}

async function sendAudioNormal(conn, chatId, audioUrl, quotedMsg) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await conn.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg'
      }, { quoted: quotedMsg });
      return true;
    } catch {
      if (attempt < MAX_RETRIES - 1) await wait(RETRY_DELAY_MS);
    }
  }
  return false;
}

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const senderNum = sender.replace(/[^0-9]/g, "");

  await conn.sendMessage(chatId, { react: { text: '🎶', key: msg.key } });

  if (isUserBlocked(senderNum)) {
    return conn.sendMessage(chatId, {
      text: "🚫 Lo siento, estás en la lista de usuarios bloqueados."
    }, { quoted: msg });
  }

  if (!args || !args.join(" ").trim()) {
    return conn.sendMessage(chatId, {
      text: `╭─⬣「 *KilluaBot* 」⬣
│ ≡◦ 🎧 *Uso correcto del comando:*
│ ≡◦ .play Anuel perfecto
╰─⬣`
    }, { quoted: msg });
  }

  const query = args.join(" ").trim();

  try {
    const searchResults = await yts(query);
    if (!searchResults?.videos?.length) throw new Error('No se encontraron resultados.');

    const videoInfo = searchResults.videos[0];
    const { title, timestamp: duration, url: videoUrl, image: thumbnail } = videoInfo;

    // Procesar imagen y agregar marca de agua
    const imagePath = './temp_thumbnail.jpg';
    const img = await Jimp.read(thumbnail);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    img.print(font, 10, img.getHeight() - 50, {
      text: 'Killua-Bot 🎧',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
    }, img.getWidth() - 20, 40);
    await img.writeAsync(imagePath);

    const caption = `╭─⬣「 *𝖪𝗂𝗅𝗅𝗎𝖺𝖡𝗈𝗍 𝖬𝗎́𝗌𝗂𝖼* 」⬣
│  🎵 *Título:* ${title}
│  ⏱ *Duración:* ${duration || 'Desconocida'}
│  🔗 *URL:* ${videoUrl}
╰─⬣

*[🛠️] 𝖣𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝗇𝖽𝗈 𝖺𝗎𝖽𝗂𝗈 𝖾𝗌𝗉𝖾𝗋𝖾...*`;

    await conn.sendMessage(chatId, {
      image: fs.readFileSync(imagePath),
      caption
    }, { quoted: msg });

    const downloadData = await getDownloadUrl(videoUrl);
    if (!downloadData?.url) throw new Error('No se pudo descargar la música.');

    await sendAudioNormal(conn, chatId, downloadData.url, msg);

  } catch (error) {
    return conn.sendMessage(chatId, {
      text: `➤ \`UPS, ERROR\` ❌

𝖯𝗋𝗎𝖾𝖻𝖾 𝗎𝗌𝖺𝗋 *.𝗋𝗈𝗅𝗂𝗍𝖺* *.𝗉𝗅𝖺𝗒1* 𝗈 *.𝗉𝗅𝖺𝗒2*
".𝗋𝖾𝗉𝗈𝗋𝗍 𝗇𝗈 𝖿𝗎𝗇𝖼𝗂𝗈𝗇𝖺 .play"
> 𝖤𝗅 𝖾𝗊𝗎𝗂𝗉𝗈 𝗅𝗈 𝗋𝖾𝗏𝗂𝗌𝖺𝗋𝖺. 🚔`
    }, { quoted: msg });
  }
};

handler.command = ["play"];
module.exports = handler;