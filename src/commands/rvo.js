const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function rvo(sock, message, args) {
    try {
        // Debug log untuk melihat struktur pesan
        console.log('=== DEBUG INFO ===');
        console.log('1. Full Message Structure:');
        console.log(JSON.stringify(message, null, 2));

        console.log('\n2. Quoted Message Info:');
        const quotedMsg = message.message.extendedTextMessage?.contextInfo;
        console.log(JSON.stringify(quotedMsg, null, 2));

        if (!quotedMsg) {
            console.log('❌ Tidak ada quoted message');
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Silakan reply pesan view once!'
            });
            return;
        }

        console.log('\n3. Media Message Structure:');
        const mediaMsg = quotedMsg.quotedMessage;
        console.log(JSON.stringify(mediaMsg, null, 2));

        // Ambil media message
        const imageMsg = mediaMsg?.imageMessage;
        const videoMsg = mediaMsg?.videoMessage;
        
        // Cek apakah pesan adalah view once
        if ((!imageMsg?.viewOnce && !videoMsg?.viewOnce)) {
            console.log('❌ Bukan pesan view once');
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Ini bukan pesan view once!'
            });
            return;
        }

        try {
            // Download media menggunakan baileys
            const buffer = await downloadMediaMessage(
                {
                    key: {
                        remoteJid: message.key.remoteJid,
                        id: quotedMsg.stanzaId
                    },
                    message: mediaMsg
                },
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            // Kirim media sesuai tipenya
            if (imageMsg) {
                await sock.sendMessage(message.key.remoteJid, {
                    image: buffer,
                    caption: imageMsg.caption || ''
                });
            } else if (videoMsg) {
                await sock.sendMessage(message.key.remoteJid, {
                    video: buffer,
                    caption: videoMsg.caption || ''
                });
            }

        } catch (downloadError) {
            console.error('Error downloading media:', downloadError);
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Gagal mengunduh media view once!'
            });
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
        await sock.sendMessage(message.key.remoteJid, {
            text: '❌ Gagal membuka media view once!'
        });
    }
}

module.exports = {
    name: 'rvo',
    description: 'mengambil foto satu kali lihat',
}, rvo;
