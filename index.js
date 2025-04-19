/* 
Simple Bedrock Realm Relay Bot
Made by Fredi 250510
*/

const bedrock = require('bedrock-protocol');

 // Configuration

const realmInvite = 'YOUR_REALM_CODE'
const modules = {
    'anti_spam': true,
    'anti_namesooft': true,
    'device_filer': true,
    'auto_reconnect': true
}

const whitelist = [ 'user1', 'user2' ] // You can add or remove players
const blocklist = [ 'user1', 'user2' ] // You can add or remove players
const blocked_devices = [ 'OSX', 'FireOS', 'GearVR', 'Hololens', 'Windows x86', 'Dedicated Server', 'TvOS', 'Windows Phone', 'Linux' ] // You can add or remove devices
let debug = false // If this Vlaue is set to true you'll recieve more Infomration on certain events

console.log(`Connecting to ${realmInvite}`)
relay()

async function relay() {
      client = bedrock.createClient({
        profilesFolder: "./auth",
        skipPing: true,
        connectTimeout: 4000,  
        offline: false,
        realms: {
       realmInvite
       }
      });

client.on('join', () => {
    console.log(`Connected to ${realmInvite}`)
});

// Player Joins, Leaves and Auto Mod Events

client.on('player_list', (packet) => {
    if (packet.records && Array.isArray(packet.records.records)) {
      switch (packet.records.type) {
        case 'add':
          packet.records.records.forEach(async (player) => {
            const Username = player.username;
            const UUID = player.uuid;
            const Player = player;
            const XUID = player.xbox_user_id || "Unknown";
            const Device = devices(player.build_platform);
            if (debug) console.log('Player List Packet:', packet);

            console.log(`Player ${Username} joined on ${Device} (${XUID}) (${UUID})`);

            if (whitelist.has(Username)) return
            if (!modules.device_filer) return

            if (Device.includes(blocked_devices)) {
              console.log(`Player ${Username} is on a blocked device (${Device})`);
              client.queue('command_request', {
                command: `kick "${XUID}" §cYou are on a blocked device: ${Device}`,
                internal: false,
                version: 66,
                origin: { type: 0, uuid: "", request_id: "" }
              });
              return;
            } else if (!modules.anti_namesooft) return

             if (Username.length > 16 || Username.includes('!"§$%&/(()=?*^:;<>|')) {
              console.log(`Player ${Username} has a namespoofed name`);
              client.queue('command_request', {
                command: `kick "${XUID}" §cNamespoof detected`,
                internal: false,
                version: 66,
                origin: { type: 0, uuid: "", request_id: "" }
              });
              return;
            } else if (blocklist.has(Username)) {
              console.log(`Player ${Username} is on the blocklist`);
              client.queue('command_request', {
                command: `kick "${XUID}" §cYou are on the blocklist`,
                internal: false,
                version: 66,
                origin: { type: 0, uuid: "", request_id: "" }
              });
              return;
            }
            client.queue('command_request', {
              command: `tellraw @a {"rawtext":[{"text":"§e${Username}§r joined on §v${Device}"}]}`,
              internal: false,
              version: 66,
              origin: { type: 0, uuid: "", request_id: "" }
            });
  });
  break;
  case 'remove':
    packet.records.records.forEach(async (player) => {
      const Username = player.username;
      const UUID = player.uuid;
      const Player = player;
      const XUID = player.xbox_user_id || "Unknown";
      const Device = devices(player.build_platform);
      
      console.log(`Player ${Username} left on ${Device} (${XUID}) (${UUID})`); 
       
        client.queue('command_request', {
          command: `tellraw @a {"rawtext":[{"text":"§e${Username}§r left on §v${Device}"}]}`,
          internal: false,
          version: 66,
          origin: { type: 0, uuid: "", request_id: "" }
        });
    });
    break;
      }
    }
  });

// Chat Events

  client.on('text', async (packet) => {
    const type = packet?.type;
    const message = packet?.message;
    const XUID = packet?.xuid;
    const source_name = packet?.source_name;
    if (debug) console.log('Chat Packet:', packet); 

    if (type === 'chat' && message.length > 250 || (type === 'announcemt' && message.length > 250) || message.startsWith ('* External') || message.startsWith (`* ${source_name}`)) return   
    if (type === 'chat'){
      console.log(`${source_name} > ${message}`);
    }
  
  else if (packet.type === 'announcement') {
      const msg = message.replace(/§./g, '');
      console.log(`${msg}`);
    }
    else if (!modules.anti_spam) return
    if (message.includes('* External')) {
      console.log(`Player ${source_name} was kicked for external spam`);
      client.queue('command_request', {
        command: `kick "${XUID}" §cExternal Spam detected`,
        internal: false,
        version: 66,
        origin: { type: 0, uuid: "", request_id: "" }
      });
    }
  });

  // Client Errors/Crashes and Auto Reconnect

client.on('error', (e) => {
    console.error('Client failed to connect:', e)
});

let reconnectAttempts = 0;
const maxReconnectAttempts = 2; 
const reconnectDelay = 5000; // 5 seconds
client.on('kick', (e) => {
    console.warn('Client crashed:', e.message)
    if (!modules.auto_reconnect) return
    reconnectAttempts++;
    if (reconnectAttempts <= maxReconnectAttempts) {
        console.log(`Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})`);
        setTimeout(relay, reconnectDelay);
    }
    else {
        console.warn('Max reconnect attempts reached');
    }
});

// Device Helper Function

function devices(platform) {
  switch (platform) {
    case 0: return 'Unknown';
    case 1: return 'Android';
    case 2: return 'iOS';
    case 3: return 'OSX';
    case 4: return 'FireOS';
    case 5: return 'GearVR';
    case 6: return 'Hololens';
    case 7: return 'Windows';
    case 8: return 'Windows x86';
    case 9: return 'Dedicated Server';
    case 10: return 'TvOS';
    case 11: return 'Play Station';
    case 12: return 'Nintendo Switch';
    case 13: return 'Xbox';
    case 14: return 'Windows Phone';
    case 15: return 'Linux';
    default: return 'Unknown';
  }
}
}