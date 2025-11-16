const fs = require('fs')

const config = {
    owner: "Illusivehacks",
    botNumber: "254743844485",
    setPair: "K0MRAID1",
    thumbUrl: "https://i.imgur.com/bcLXgmI.jpeg",
    session: "sessions",
    status: {
        public: true,
        terminal: true,
        reactsw: false
    },
    message: {
        owner: "no, this is for owners only",
        group: "this is for groups only",
        admin: "this command is for admin only",
        private: "this is specifically for private chat"
    },
    mess: {
        owner: 'This command is only for the bot owner!',
        done: 'Mode changed successfully!',
        error: 'Something went wrong!',
        wait: 'Please wait...'
    },
    settings: {
        title: "Whatsapp Bot",
        packname: 'Illusivehacks',
        description: "this script was created by Illusivehacks",
        author: 'https://github.com/Illusivehacks/nexus-whatsapp-bot.git',
        footer: "@Illusivehacks"
    },
    newsletter: {
        name: "Whatsapp bot",
        id: "0@newsletter"
    },
    api: {
        baseurl: "https://hector-api.vercel.app/",
        apikey: "hector"
    },
    sticker: {
        packname: "Whatsapp Bot",
        author: "Illusivehacks"
    }
}

module.exports = config;

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
