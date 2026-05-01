const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    getContentType,
    fetchLatestBaileysVersion,
    delay
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const { cm } = require("./framework/ozen");
const conf = require("./config");
const fs = require("fs");
const path = require("path");

// ── RESTAURATION DE SESSION (Katabump / Serveur) ──────────────────────────
// Définissez SESSION_ID dans les variables d'environnement Katabump.
// Valeur = contenu de auth/creds.json encodé en Base64.
const AUTH_PATH = path.join(__dirname, "auth");

if (process.env.SESSION_ID) {
    try {
        if (!fs.existsSync(AUTH_PATH)) fs.mkdirSync(AUTH_PATH, { recursive: true });
        const credsData = Buffer.from(process.env.SESSION_ID, "base64").toString("utf-8");
        fs.writeFileSync(path.join(AUTH_PATH, "creds.json"), credsData);
        console.log("✅ Session restaurée depuis SESSION_ID.");
    } catch (e) {
        console.error("❌ Erreur de restauration de session :", e.message);
    }
}

// Les variables d'environnement ont priorité sur config.js
const PREFIXE      = process.env.PREFIX        || conf.prefixe;
const PHONE_NUMBER = process.env.PHONE_NUMBER  || null;

const AUTORISES = conf.proprietaire.map(n => n.replace(/[^0-9]/g, ""));

function extraireNum(jid) {
    if (!jid) return '';
    const sansAt = jid.split('@')[0];
    const parties = sansAt.split(':');
    if (parties.length === 1) return parties[0];
    const derniere = parties[parties.length - 1];
    if (derniere.length <= 3) return parties.slice(0, -1).join('');
    return parties.join('');
}

// isTTY = terminal local | !isTTY = serveur (Katabump, etc.)
const IS_SERVER = !process.stdin.isTTY;

async function startOzen() {
    if (!fs.existsSync(AUTH_PATH)) fs.mkdirSync(AUTH_PATH, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
    const { version } = await fetchLatestBaileysVersion();

    const zk = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false,
        shouldIgnoreJid: () => false,
        getMessage: async () => ({ conversation: "" })
    });

    // ── AUTHENTIFICATION ─────────────────────────────────────────────────
    if (!zk.authState.creds.registered) {
        if (IS_SERVER) {
            // Mode serveur : Pairing Code automatique via PHONE_NUMBER
            if (!PHONE_NUMBER) {
                console.error("❌ Bot non authentifié sur le serveur.");
                console.error("   → Définissez SESSION_ID (recommandé)");
                console.error("     ou PHONE_NUMBER dans les variables d'environnement Katabump.");
                process.exit(1);
            }
            const phoneClean = PHONE_NUMBER.replace(/\D/g, "");
            await delay(1500);
            try {
                const code = await zk.requestPairingCode(phoneClean);
                console.log(`\n🌀 Code de jumelage OZEN-MD : ${code}`);
                console.log("⚠️  Entrez ce code sur WhatsApp dans les 60 secondes !");
                console.log("   Puis récupérez auth/creds.json, encodez-le en Base64,");
                console.log("   et définissez-le comme SESSION_ID dans Katabump.");
            } catch (err) {
                console.error("❌ Erreur pairing :", err.message);
                process.exit(1);
            }
        } else {
            // Mode local interactif (développement)
            const readline = require("readline");
            const question = (text) => new Promise((resolve) => {
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                rl.question(text, (ans) => { rl.close(); resolve(ans); });
            });

            const mode = await question("Connexion :\n1. QR Code\n2. Pairing Code\nEntrez 1 ou 2 : ");
            if (mode === "2") {
                let phoneNumber = await question("📞 Numéro (ex: 22505XXXXXXXX) : ");
                if (!phoneNumber) return console.log("❌ Numéro manquant.");
                phoneNumber = phoneNumber.replace(/\D/g, "");
                if (phoneNumber.length === 10 && !phoneNumber.startsWith("225")) phoneNumber = "225" + phoneNumber;
                await delay(1000);
                try {
                    const code = await zk.requestPairingCode(phoneNumber);
                    console.log(`\n🌀 Code OZEN-MD : ${code}`);
                    console.log("⚠️  Entrez ce code sur votre téléphone dans les 60 secondes !");
                } catch (err) {
                    console.error("❌ Erreur pairing :", err.message); return;
                }
            } else {
                zk.ev.on("connection.update", (update) => {
                    if (update.qr) {
                        console.log("📸 Scannez le QR Code :");
                        qrcode.generate(update.qr, { small: true });
                    }
                });
            }
        }
    }

    // ── CHARGEMENT DES PLUGINS ───────────────────────────────────────────
    console.log("🌊 Chargement des modules Ozen-MD...");
    const pluginsDir = path.join(__dirname, "plugins");
    if (fs.existsSync(pluginsDir)) {
        fs.readdirSync(pluginsDir).forEach(file => {
            if (file.endsWith(".js")) {
                try { require(path.join(pluginsDir, file)); }
                catch (e) { console.error(`⚠️  Plugin ${file} :`, e.message); }
            }
        });
    }

    zk.ev.on("creds.update", saveCreds);

    // ── GESTION DE LA CONNEXION ──────────────────────────────────────────
    zk.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnexion dans 3s...");
                setTimeout(startOzen, 3000);
            } else {
                console.log("❌ Déconnecté définitivement. Réinitialisez la SESSION_ID.");
                process.exit(0);
            }
        } else if (connection === "open") {
            console.log(`✅ OZEN-MD connecté !`);
            console.log(`🔐 Numéros autorisés : ${AUTORISES.join(", ")}`);
            console.log(`👁️  Visionnage automatique des statuts : ACTIVÉ`);
        }
    });

    // ── VISIONNAGE AUTOMATIQUE DES STATUTS ──────────────────────────────
    zk.ev.on("messages.upsert", async (m) => {
        try {
            for (const msg of m.messages) {
                if (msg.key.remoteJid !== "status@broadcast") continue;
                if (!msg.message) continue;
                const expediteur = msg.key.participant || msg.key.remoteJid;
                const num = extraireNum(expediteur);
                await zk.readMessages([msg.key]);
                console.log(`👁️  Statut visionné : +${num}`);
            }
        } catch (e) { /* Silencieux */ }
    });

    // ── TRAITEMENT DES COMMANDES ─────────────────────────────────────────
    zk.ev.on("messages.upsert", async (m) => {
        const ms = m.messages[0];
        if (!ms.message) return;

        const mtype = getContentType(ms.message);
        const texte = (mtype === "conversation")        ? ms.message.conversation :
                      (mtype === "extendedTextMessage")  ? ms.message.extendedTextMessage.text :
                      (mtype === "imageMessage")         ? ms.message.imageMessage.caption :
                      (mtype === "videoMessage")         ? ms.message.videoMessage.caption : "";

        if (!texte || !texte.startsWith(PREFIXE)) return;

        const dest = ms.key.remoteJid;
        const repondre = (txt) => zk.sendMessage(dest, { text: String(txt) }, { quoted: ms });

        const estFromMe = ms.key.fromMe;
        let auteurNum = "";

        if (estFromMe) {
            auteurNum = AUTORISES[0];
        } else {
            const jidBrut = ms.key.participant || ms.key.remoteJid || "";
            auteurNum = extraireNum(jidBrut);
        }

        console.log(`\n📩 Commande : "${texte}" | fromMe: ${estFromMe} | auteur: ${auteurNum}`);

        const estAutorise = estFromMe || AUTORISES.includes(auteurNum.replace(/[^0-9]/g, ""));
        if (!estAutorise) {
            console.log(`🚫 Accès refusé pour : ${auteurNum}`);
            return repondre(`🚫 *ACCÈS REFUSÉ*\n\nCe bot est privé.\n_OZEN-MD_`);
        }

        console.log(`✅ Accès accordé pour : ${auteurNum}`);

        const arg = texte.slice(PREFIXE.length).trim().split(/ +/);
        const command = arg.shift().toLowerCase();
        const cmd = cm.find(c => c.nomCom === command || (c.alias && c.alias.includes(command)));
        if (!cmd) return;

        const auteurMessage = auteurNum + "@s.whatsapp.net";
        const superUser = true;
        const verifGroupe = dest.endsWith("@g.us");
        let infosGroupe = null;
        let verifAdmin = false;

        if (verifGroupe) {
            try {
                infosGroupe = await zk.groupMetadata(dest);
                const p = infosGroupe.participants.find(p => extraireNum(p.id) === auteurNum);
                verifAdmin = p?.admin === "admin" || p?.admin === "superadmin";
            } catch (e) {}
        }

        const contextInfo = ms.message[mtype]?.contextInfo;
        const msgRepondu = contextInfo?.quotedMessage || null;
        const auteurMsgRepondu = contextInfo?.participant
            ? extraireNum(contextInfo.participant) + "@s.whatsapp.net" : null;

        const options = {
            ms, arg, repondre, mtype, prefixe: PREFIXE,
            verifGroupe, verifAdmin, infosGroupe,
            nomGroupe: infosGroupe ? infosGroupe.subject : "",
            auteurMessage, msgRepondu, auteurMsgRepondu, superUser
        };

        try {
            await zk.sendMessage(dest, { react: { text: cmd.reaction || "🌀", key: ms.key } });
            await cmd.fonction(dest, zk, options);
        } catch (e) {
            console.error("Erreur plugin :", e.message);
            repondre("❌ Erreur : " + e.message);
        }
    });
}

startOzen().catch(e => {
    console.error("Erreur critique :", e.message);
    process.exit(1);
});
