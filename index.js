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

const PREFIXE      = process.env.PREFIX        || conf.prefixe;
const PHONE_NUMBER = process.env.PHONE_NUMBER  || null;

// ── GESTION DYNAMIQUE DES OWNERS ──────────────────────────────────────────
// On charge depuis le fichier owners.json si il existe, sinon depuis config.js
const OWNERS_FILE = path.join(__dirname, "owners.json");

function chargerOwners() {
    try {
        if (fs.existsSync(OWNERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(OWNERS_FILE, "utf-8"));
            return data.map(n => n.replace(/[^0-9]/g, ""));
        }
    } catch (e) {}
    return conf.proprietaire.map(n => n.replace(/[^0-9]/g, ""));
}

function sauvegarderOwners(liste) {
    try {
        fs.writeFileSync(OWNERS_FILE, JSON.stringify(liste, null, 2));
    } catch (e) {
        console.error("❌ Erreur sauvegarde owners:", e.message);
    }
}

// Propriétaire principal (ne peut jamais être retiré)
const OWNER_PRINCIPAL = conf.OWNER.replace(/[^0-9]/g, "");

// Commandes accessibles à tous même en mode privé
const COMMANDES_PUBLIQUES = (conf.commandesPubliques || []).map(c => c.toLowerCase());

// ── EXTRACTION DU NUMÉRO DEPUIS UN JID ────────────────────────────────────
function extraireNum(jid) {
    if (!jid) return '';
    const sansAt = jid.split('@')[0];
    const parties = sansAt.split(':');
    if (parties.length === 1) return parties[0];
    const derniere = parties[parties.length - 1];
    if (derniere.length <= 3) return parties.slice(0, -1).join('');
    return parties.join('');
}

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
            if (!PHONE_NUMBER) {
                console.error("❌ Bot non authentifié sur le serveur.");
                console.error("   → Définissez SESSION_ID (recommandé)");
                console.error("     ou PHONE_NUMBER dans les variables d'environnement.");
                process.exit(1);
            }
            const phoneClean = PHONE_NUMBER.replace(/\D/g, "");
            await delay(1500);
            try {
                const code = await zk.requestPairingCode(phoneClean);
                console.log(`\n🌀 Code de jumelage OZEN-MD : ${code}`);
                console.log("⚠️  Entrez ce code sur WhatsApp dans les 60 secondes !");
            } catch (err) {
                console.error("❌ Erreur pairing :", err.message);
                process.exit(1);
            }
        } else {
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
            const owners = chargerOwners();
            console.log(`✅ OZEN-MD connecté !`);
            console.log(`🔐 Mode : ${conf.MODE}`);
            console.log(`👑 Owners : ${owners.join(", ")}`);
            console.log(`🌐 Commandes publiques : ${COMMANDES_PUBLIQUES.join(", ") || "aucune"}`);
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

        // ── IDENTIFICATION DE L'AUTEUR ──────────────────────────────────
        // BUG CORRIGÉ : on lit les owners depuis le fichier dynamique à chaque message
        const AUTORISES = chargerOwners();

        const estFromMe = ms.key.fromMe;
        let auteurNum = "";

        if (estFromMe) {
            // Message envoyé depuis le téléphone du bot → c'est forcément l'owner principal
            auteurNum = OWNER_PRINCIPAL;
        } else {
            // BUG CORRIGÉ : en groupe, le JID de l'auteur est dans ms.key.participant
            // En privé, c'est ms.key.remoteJid (ex: 225XXXXXX@s.whatsapp.net)
            const jidBrut = ms.key.participant || ms.key.remoteJid || "";
            auteurNum = extraireNum(jidBrut);
        }

        const auteurNumPropre = auteurNum.replace(/[^0-9]/g, "");
        console.log(`\n📩 Commande : "${texte}" | fromMe: ${estFromMe} | auteur: ${auteurNumPropre}`);

        // ── EXTRACTION DE LA COMMANDE ───────────────────────────────────
        const arg = texte.slice(PREFIXE.length).trim().split(/ +/);
        const command = arg.shift().toLowerCase();

        // ── VÉRIFICATION DES PERMISSIONS ───────────────────────────────
        const estOwner = estFromMe || AUTORISES.includes(auteurNumPropre);
        const estCommandePublique = COMMANDES_PUBLIQUES.includes(command);
        const modePublic = (conf.MODE || "private") === "public";

        // Accès autorisé si :
        // 1. L'auteur est owner
        // 2. Le mode est "public"
        // 3. La commande est dans la liste des commandes publiques (peu importe le mode)
        const estAutorise = estOwner || modePublic || estCommandePublique;

        if (!estAutorise) {
            console.log(`🚫 Accès refusé pour : ${auteurNumPropre}`);
            return repondre(`🚫 *ACCÈS REFUSÉ*\n\nCe bot est en mode privé.\n_OZEN-MD_`);
        }

        console.log(`✅ Accès accordé pour : ${auteurNumPropre} (owner: ${estOwner}, public: ${modePublic}, cmdPublique: ${estCommandePublique})`);

        // ── RECHERCHE DE LA COMMANDE ────────────────────────────────────
        const cmd = cm.find(c => c.nomCom === command || (c.alias && c.alias.includes(command)));
        if (!cmd) return;

        // ── COMMANDES INTÉGRÉES : GESTION DES OWNERS ───────────────────
        // Ces commandes sont traitées ici pour avoir accès direct à AUTORISES et la sauvegarde

        // #addowner <numéro> — Ajouter un owner (owner principal seulement)
        if (command === "addowner") {
            if (auteurNumPropre !== OWNER_PRINCIPAL) {
                return repondre("🚫 Seul l'owner principal peut ajouter des owners.");
            }
            const nouveauNum = (arg[0] || "").replace(/[^0-9]/g, "");
            if (!nouveauNum) return repondre("⚠️ Usage : *#addowner <numéro>*\nEx: #addowner 2250XXXXXXXXX");
            const owners = chargerOwners();
            if (owners.includes(nouveauNum)) {
                return repondre(`⚠️ *${nouveauNum}* est déjà owner.`);
            }
            owners.push(nouveauNum);
            sauvegarderOwners(owners);
            console.log(`👑 Nouveau owner ajouté : ${nouveauNum}`);
            return repondre(`✅ *+${nouveauNum}* a été ajouté comme owner.\n\n👑 Owners actuels :\n${owners.map(n => `• +${n}`).join("\n")}`);
        }

        // #removeowner <numéro> — Retirer un owner (owner principal seulement)
        if (command === "removeowner") {
            if (auteurNumPropre !== OWNER_PRINCIPAL) {
                return repondre("🚫 Seul l'owner principal peut retirer des owners.");
            }
            const numRetirer = (arg[0] || "").replace(/[^0-9]/g, "");
            if (!numRetirer) return repondre("⚠️ Usage : *#removeowner <numéro>*\nEx: #removeowner 2250XXXXXXXXX");
            if (numRetirer === OWNER_PRINCIPAL) {
                return repondre("🚫 Impossible de retirer l'owner principal.");
            }
            const owners = chargerOwners();
            const index = owners.indexOf(numRetirer);
            if (index === -1) {
                return repondre(`⚠️ *${numRetirer}* n'est pas dans la liste des owners.`);
            }
            owners.splice(index, 1);
            sauvegarderOwners(owners);
            console.log(`👑 Owner retiré : ${numRetirer}`);
            return repondre(`✅ *+${numRetirer}* a été retiré des owners.\n\n👑 Owners restants :\n${owners.map(n => `• +${n}`).join("\n")}`);
        }

        // #owners — Lister les owners actuels
        if (command === "owners") {
            const owners = chargerOwners();
            return repondre(`👑 *LISTE DES OWNERS*\n\n${owners.map((n, i) => `${i === 0 ? "🔑" : "👤"} +${n}${i === 0 ? " (principal)" : ""}`).join("\n")}\n\n_Total : ${owners.length} owner(s)_`);
        }

        // ── CONTEXTE DE LA COMMANDE ─────────────────────────────────────
        const auteurMessage = auteurNumPropre + "@s.whatsapp.net";
        const superUser = estOwner; // true si owner, false si simple utilisateur en mode public
        const verifGroupe = dest.endsWith("@g.us");
        let infosGroupe = null;
        let verifAdmin = false;

        if (verifGroupe) {
            try {
                infosGroupe = await zk.groupMetadata(dest);
                const p = infosGroupe.participants.find(p => extraireNum(p.id) === auteurNumPropre);
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
            auteurMessage, msgRepondu, auteurMsgRepondu, superUser,
            // Infos utiles supplémentaires
            estOwner,
            ownerPrincipal: OWNER_PRINCIPAL,
            sender: auteurNumPropre,
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
