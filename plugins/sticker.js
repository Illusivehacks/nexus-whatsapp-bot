const { writeExifImg, addExif } = require('../library/exif');
const { getBuffer } = require('../library/function');
const fs = require('fs');

module.exports = {
    command: 'sticker',
    description: 'Convert replied image to sticker with custom pack info',
    category: 'tools',
    
    execute: async (sock, m, {
        args,
        text,
        q,
        quoted,
        mime,
        qmsg,
        isMedia,
        groupMetadata,
        groupName,
        participants,
        groupOwner,
        groupAdmins,
        isBotAdmins,
        isAdmins,
        isGroupOwner,
        isCreator,
        prefix,
        reply,
        config,
        sender
    }) => {
        try {
            // Tech reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "🎨", key: m.key } 
            });

            // Check if user replied to a message
            if (!m.quoted) {
                const helpMessage = 
`🔄 *STICKER MAKER*

*Usage:*
${prefix}sticker - Convert replied image to sticker
${prefix}sticker Pack Name | Author - Custom sticker info

*Examples:*
• Reply to image + "${prefix}sticker"
• Reply to image + "${prefix}sticker My Pack | Nexus"
• Reply to image + "${prefix}sticker Cool Stickers | Illusivehacks"

*Supported formats:* JPG, PNG, WebP, GIF
*Max size:* 1MB for best results`;

                await reply(helpMessage);
                await sock.sendMessage(m.chat, { 
                    react: { text: "ℹ️", key: m.key } 
                });
                return;
            }

            // Check if the quoted message is an image
            const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!m.quoted.mtype || !supportedMimes.includes(m.quoted.mimetype)) {
                await reply(`❌ Unsupported file type!\n\nPlease reply to an *image* (JPG, PNG, WebP, GIF)\n\nReceived: ${m.quoted.mimetype || 'Unknown'}`);
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                return;
            }

            // Check file size (rough estimate)
            if (m.quoted.message?.imageMessage?.fileLength > 5 * 1024 * 1024) {
                await reply('❌ Image is too large! Please use images under 5MB for best performance.');
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                return;
            }

            // Extract packname and author from command text
            let packname = "Nexus Bot";
            let author = "Illusivehacks";
            
            if (text) {
                const parts = text.split('|');
                if (parts[0]) packname = parts[0].trim() || packname;
                if (parts[1]) author = parts[1].trim() || author;
            }

            // Inform user about processing
            await reply(`🔄 Creating your sticker...\n\n📦 Pack: ${packname}\n👤 Author: ${author}`);

            // Download the image
            const tempFile = `./temp/sticker_${Date.now()}.${m.quoted.mimetype.split('/')[1] || 'jpg'}`;
            const media = await sock.downloadAndSaveMediaMessage(m.quoted, tempFile);
            
            if (!media || !fs.existsSync(media)) {
                await reply('❌ Failed to download the image. Please try again with a different image.');
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                return;
            }

            // Create sticker with metadata
            const stickerOptions = {
                packname: packname.substring(0, 30),
                author: author.substring(0, 30)
            };

            let stickerBuffer;
            try {
                if (m.quoted.mimetype === 'image/gif') {
                    // Handle GIF stickers differently if needed
                    stickerBuffer = await addExif(fs.readFileSync(media));
                } else {
                    stickerBuffer = await writeExifImg(fs.readFileSync(media), stickerOptions);
                }
            } catch (stickerError) {
                console.error('Sticker creation error:', stickerError);
                await reply('❌ Failed to process image. The file might be corrupted or in an unsupported format.');
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                
                // Cleanup
                if (fs.existsSync(media)) fs.unlinkSync(media);
                return;
            }

            if (!stickerBuffer || stickerBuffer.length === 0) {
                await reply('❌ Sticker creation failed. The image might be too large or corrupted.');
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                
                // Cleanup
                if (fs.existsSync(media)) fs.unlinkSync(media);
                return;
            }

            // Send the sticker
            await sock.sendMessage(m.chat, {
                sticker: stickerBuffer
            }, { quoted: m });

            // Success message
            await reply(`✅ Sticker created successfully!\n\n📦 Pack: ${packname}\n👤 Author: ${author}\n\n💡 *Tip:* Use ${prefix}sticker "Your Pack" | "Your Name" for custom stickers`);

            // Success reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "✅", key: m.key } 
            });

            // Clean up temporary file
            try {
                if (fs.existsSync(media)) {
                    fs.unlinkSync(media);
                }
            } catch (cleanupError) {
                console.log('Cleanup error:', cleanupError);
            }

        } catch (error) {
            console.error("Error in sticker command:", error);
            
            // Error reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            
            await reply(`🚨 Sticker creation failed!\n\nError: ${error.message}\n\nPlease try with a different image or check if the image is supported.`);
        }
    }
};