const fs = require('fs');
const path = require('path');

// File to store hibernation state
const HIBERNATE_FILE = path.join(__dirname, '../settings/hibernate.json');

// Default state if file doesn't exist
const defaultState = {
    hibernating: false,
    activatedBy: null,
    activatedAt: null,
    deactivatedBy: null,
    deactivatedAt: null
};

// Read hibernation state
function readHibernateState() {
    try {
        if (fs.existsSync(HIBERNATE_FILE)) {
            const data = fs.readFileSync(HIBERNATE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading hibernate state:', error);
    }
    return defaultState;
}

// Write hibernation state
function writeHibernateState(state) {
    try {
        fs.writeFileSync(HIBERNATE_FILE, JSON.stringify(state, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing hibernate state:', error);
        return false;
    }
}

// Check if bot is hibernating (to be used in message.js)
function isHibernating() {
    const state = readHibernateState();
    return state.hibernating;
}

module.exports = {
    command: 'hibernate',
    description: 'Enable/disable bot functionality (Owner only)',
    category: 'owner',
    owner: true, // Only bot owner can use this
    
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
        config: cmdConfig,
        sender
    }) => {
        try {
            // 🔒 STRICT OWNER CHECK - Only 254743844485 can use this
            const allowedOwner = "254743844485@s.whatsapp.net";
            if (sender !== allowedOwner) {
                console.log(`🚨 SECURITY: Unauthorized hibernate attempt from: ${sender}`);
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                return; // Silent exit - no response
            }

            // Tech reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "💤", key: m.key } 
            });

            const currentState = readHibernateState();
            const action = args[0]?.toLowerCase();
            const userName = m.pushName || "Owner";
            const timestamp = new Date().toISOString();

            if (!action || (action !== 'on' && action !== 'off')) {
                const status = currentState.hibernating ? '🟢 HIBERNATING' : '🔴 ACTIVE';
                const lastAction = currentState.hibernating ? 
                    `Activated by: ${currentState.activatedBy}\nAt: ${new Date(currentState.activatedAt).toLocaleString()}` :
                    currentState.deactivatedBy ? 
                    `Deactivated by: ${currentState.deactivatedBy}\nAt: ${new Date(currentState.deactivatedAt).toLocaleString()}` :
                    'Never deactivated';

                await reply(
`💤 *HIBERNATION STATUS*

${status}

${lastAction}

*Usage:*
${prefix}hibernate on - Enable hibernation
${prefix}hibernate off - Disable hibernation

⚠️ *Hibernation will make all bot commands inaccessible until turned off.*`
                );
                return;
            }

            if (action === 'on') {
                if (currentState.hibernating) {
                    await reply('❌ Bot is already in hibernation mode!');
                    return;
                }

                const newState = {
                    hibernating: true,
                    activatedBy: userName,
                    activatedAt: timestamp,
                    deactivatedBy: currentState.deactivatedBy,
                    deactivatedAt: currentState.deactivatedAt
                };

                if (writeHibernateState(newState)) {
                    await reply(
`💤 *HIBERNATION ACTIVATED*

✅ Bot is now in hibernation mode.

*All commands have been disabled.*
*Only you can use ${prefix}hibernate off to wake the bot.*

🔒 Activated by: ${userName}
⏰ Time: ${new Date().toLocaleString()}

The bot will remain silent until hibernation is turned off.`
                    );
                    
                    // Success reaction
                    await sock.sendMessage(m.chat, { 
                        react: { text: "✅", key: m.key } 
                    });

                    console.log(`🐻 HIBERNATION: Bot put to sleep by ${sender}`);
                } else {
                    await reply('❌ Failed to activate hibernation mode!');
                }

            } else if (action === 'off') {
                if (!currentState.hibernating) {
                    await reply('❌ Bot is not in hibernation mode!');
                    return;
                }

                const newState = {
                    hibernating: false,
                    activatedBy: currentState.activatedBy,
                    activatedAt: currentState.activatedAt,
                    deactivatedBy: userName,
                    deactivatedAt: timestamp
                };

                if (writeHibernateState(newState)) {
                    await reply(
`🌅 *HIBERNATION DEACTIVATED*

✅ Bot is now active and responsive!

*All commands have been re-enabled.*
*The bot is ready to serve commands.*

🔓 Deactivated by: ${userName}
⏰ Time: ${new Date().toLocaleString()}

Bot is now fully operational! 🚀`
                    );
                    
                    // Success reaction
                    await sock.sendMessage(m.chat, { 
                        react: { text: "✅", key: m.key } 
                    });

                    console.log(`🐻 HIBERNATION: Bot woken up by ${sender}`);
                } else {
                    await reply('❌ Failed to deactivate hibernation mode!');
                }
            }

        } catch (error) {
            console.error("Error in hibernate command:", error);
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            await reply("🚨 Failed to toggle hibernation mode. Please try again.");
        }
    }
};

// Export the check function for use in message.js
module.exports.isHibernating = isHibernating;