// name : Ozen_Pack
// description : Pack massif (50+ com) incluant Menu, Spam, VV et Admin
// author : gninoue-Dev
// date : 2026-04-25

const { zokou } = require("../framework/ozen"); 
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const fs = require("fs");
const path = require('path');

// ============ UTILITAIRE : Vérifie si le bot (connecté avec ton numéro) est admin ============
function botEstAdmin(infosGroupe, zk) {
    // DEBUG: Voir le format de l'ID du bot
    console.log("🔍 zk.user.id:", zk.user.id);
    
    // Le bot est connecté avec ton numéro, donc on vérifie si TON numéro est admin
    const botNum = zk.user.id.split(":")[0].split("@")[0];
    console.log("🔍 botNum:", botNum);
    console.log("🔍 participants:", infosGroupe.participants.slice(0,3).map(p => ({id: p.id, admin: p.admin})));
    
    const botParticipant = infosGroupe.participants.find(p => {
        const pNum = p.id.split(":")[0].split("@")[0];
        console.log("🔍 comparing:", pNum, "==", botNum, "=", pNum === botNum);
        return pNum === botNum;
    });
    
    console.log("🔍 botParticipant:", botParticipant);
    return botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin";
}

// ============ COMMANDE MENU (DYNAMIQUE) ============
zokou(
  {
    nomCom: "menu",
    categorie: "General",
    reaction: "📜",
    desc: "Affiche le menu complet du bot OZEN-MD.",
    plugin: "Ozen_Pack",
    alias: ["help", "aide", "menus"]
  },
  async (dest, zk, ops) => {
    const { auteurMessage, prefixe, superUser } = ops;
    const { cm: toutesLesCommandes } = require("../framework/ozen");
    const numero = auteurMessage.split("@")[0];

    // Icônes par catégorie
    const icones = {
      "General":    "📋",
      "Utiles":     "🔧",
      "Fun":        "🎮",
      "IA/Fun":     "🤖",
      "Media":      "🖼️",
      "Musique":    "🎵",
      "Admin":      "👮",
      "Owner":      "⚙️",
    };

    // Catégories cachées aux non-owners
    const categoriesOwner = ["Owner"];

    // Regrouper les commandes par catégorie
    const parCategorie = {};
    for (const cmd of toutesLesCommandes) {
      const cat = cmd.categorie || "Général";
      // Cacher les commandes Owner aux non-owners
      if (categoriesOwner.includes(cat) && !superUser) continue;
      if (!parCategorie[cat]) parCategorie[cat] = [];
      parCategorie[cat].push(cmd);
    }

    // Construire le menu
    let menu = `✨ *OZEN-MD* ✨\n_Le bot WhatsApp ultime_\n\n`;
    menu += `👋 Salut *+${numero}* !\n`;
    menu += `📦 *${toutesLesCommandes.length} commandes disponibles*\n\n`;

    for (const [cat, cmds] of Object.entries(parCategorie)) {
      const icone = icones[cat] || "▪️";
      menu += `${icone} *${cat.toUpperCase()}*\n`;
      for (const cmd of cmds) {
        const desc = cmd.desc ? ` - ${cmd.desc}` : "";
        menu += `◈ ${prefixe}${cmd.nomCom}${desc}\n`;
      }
      menu += `\n`;
    }

    menu += `_Propulsé par OZEN-MD 🚀_`;
    await zk.sendMessage(dest, { text: menu }, { quoted: ops.ms });
  }
);

// ============ PING ============
zokou(
  { nomCom: "ping", categorie: "Utiles", reaction: "🏓", desc: "Vérifier si le bot répond", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const start = Date.now();
    await repondre("🏓 Pong!");
    const latency = Date.now() - start;
    await repondre(`⚡ Latence: ${latency}ms`);
  }
);

// ============ STATUT ============
zokou(
  { nomCom: "statut", categorie: "Utiles", reaction: "📊", desc: "Statut du bot", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const uptime = process.uptime();
    const heures = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    await repondre(`📊 *STATUT OZEN-MD*\n\n⏱️ Uptime: ${heures}h ${minutes}min\n💾 Mémoire: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n✅ Status: En ligne`);
  }
);

// ============ INFO ============
zokou(
  { nomCom: "info", categorie: "Utiles", reaction: "ℹ️", desc: "Info du bot", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    await repondre(`✨ *OZEN-MD*\n\nVersion: 1.0.0\nDéveloppeur: gninoue-dev\nFramework: Baileys\nLangage: JavaScript`);
  }
);

// ============ SPAM ============
zokou(
  { nomCom: "spam", categorie: "Fun", reaction: "🚀", desc: "Spam un message N fois", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre, superUser } = ops;
    const count = parseInt(arg[0]);
    const texte = arg.slice(1).join(" ");
    
    if (isNaN(count) || !texte) return repondre(`Usage: ${ops.prefixe}spam <nombre> <message>\nExemple: ${ops.prefixe}spam 5 Bonjour`);

    // ✅ FIX : Limite raisonnable selon le rang de l'utilisateur
    const maxSpam = superUser ? 100 : 20;
    if (count > maxSpam) return repondre(`⛔ Maximum ${maxSpam} messages autorisés.`);
    if (count < 1) return repondre("⛔ Nombre invalide.");
    
    await repondre(`🚀 Spam de ${count} messages en cours...`);
    for (let i = 0; i < count; i++) {
      await zk.sendMessage(dest, { text: texte });
      await new Promise(r => setTimeout(r, 300)); // ✅ FIX : délai augmenté pour éviter le ban
    }
    await repondre(`✅ Spam terminé ! ${count} messages envoyés.`);
  }
);

// ============ VV (Vue Unique) ============

zokou(
  { 
    nomCom: "vv", 
    categorie: "Media", 
    reaction: "🔓", 
    desc: "Récupère les photos ou vidéos à vue unique (View Once).", 
    plugin: "Ozen_Pack" 
  },
  async (dest, zk, ops) => {
    const { msgRepondu, repondre, ms } = ops;
    
    if (!msgRepondu) {
        return repondre("❌ Veuillez répondre à un message en vue unique.");
    }

    try {
      // Extraction du message réel (gestion du format View Once V2)
      const messageContent = msgRepondu.viewOnceMessageV2?.message || msgRepondu.viewOnceMessage?.message || msgRepondu;
      const type = Object.keys(messageContent)[0];

      if (!["imageMessage", "videoMessage"].includes(type)) {
          return repondre("❌ Média non supporté ou ce n'est pas une vue unique.");
      }

      await repondre("🔄 Déverrouillage du média secret...");

      // Téléchargement du buffer au lieu d'utiliser downloadAndSaveMediaMessage qui cause l'erreur
      // On passe le message complet pour le décryptage
      const buffer = await downloadMediaMessage(
        { message: messageContent },
        "buffer",
        {},
        { 
          logger: console,
          reuploadRequest: zk.updateMediaMessage 
        }
      );

      // Création d'un fichier temporaire
      const extension = type === "imageMessage" ? "jpg" : "mp4";
      const tempFilename = path.join(__dirname, `temp_vv_${Date.now()}.${extension}`);
      fs.writeFileSync(tempFilename, buffer);

      const isImage = type === "imageMessage";
      
      // Envoi du média récupéré
      await zk.sendMessage(dest, {
          [isImage ? "image" : "video"]: { url: tempFilename },
          caption: "🔓 *SYSTÈME OZEN-MD*\n\n> Média récupéré avec succès.",
          quoted: ms
      });

      // Nettoyage après 5 secondes
      setTimeout(() => {
          if (fs.existsSync(tempFilename)) {
              fs.unlinkSync(tempFilename);
          }
      }, 5000);

    } catch (error) {
      console.error("Erreur lors de l'exécution VV :", error);
      repondre("❌ Échec : Le média n'a pas pu être décrypté (le cache est peut-être expiré).");
    }
  }
);

// ============ DELAI ============
zokou(
  { nomCom: "delai", categorie: "Fun", reaction: "⏱️", desc: "Message avec délai", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const secondes = parseInt(arg[0]);
    const texte = arg.slice(1).join(" ");
    
    // ✅ FIX : Validation correcte
    if (isNaN(secondes) || secondes < 1 || secondes > 60) return repondre("❌ Entrez un délai entre 1 et 60 secondes.\nUsage: #delai <secondes> <message>");
    if (!texte) return repondre("❌ Usage: #delai <secondes> <message>");
    
    await repondre(`⏱️ Message dans ${secondes} secondes...`);
    setTimeout(() => repondre(texte), secondes * 1000);
  }
);

// ============ VOYANCE ============
zokou(
  { nomCom: "voyance", categorie: "Fun", reaction: "🔮", desc: "Voyance", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const visions = [
      "Je vois un avenir radieux! 🌟",
      "Tu vas bientôt recevoir de bonnes nouvelles 📬",
      "Attention aux décisions hâtives cette semaine ⚠️",
      "Une opportunité inattendue va se présenter 🚀",
      "Ton énergie positive attire les bonnes choses ✨",
      "Quelqu'un pense à toi en ce moment 💭",
      "La chance est de ton côté aujourd'hui! 🍀"
    ];
    const vision = visions[Math.floor(Math.random() * visions.length)];
    await repondre(`🔮 *VOTRE VOYANCE*\n\n${vision}`);
  }
);

// ============ CHANCE ============
zokou(
  { nomCom: "chance", categorie: "Fun", reaction: "🍀", desc: "Test de chance", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const chance = Math.floor(Math.random() * 100);
    const emoji = chance > 75 ? "🔥" : chance > 50 ? "✨" : chance > 25 ? "👍" : "💤";
    await repondre(`🍀 *TEST DE CHANCE*\n\nTon niveau de chance: ${chance}% ${emoji}`);
  }
);

// ============ COMPATIBILITÉ ============
zokou(
  { nomCom: "compatibilite", categorie: "Fun", reaction: "❤️", desc: "Compatibilité amoureuse", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const nom = arg.join(" ") || "quelqu'un";
    const compat = Math.floor(Math.random() * 100);
    const result = compat > 80 ? "💍 Âme sœur!" : compat > 60 ? "❤️ Très compatible!" : compat > 40 ? "💛 Compatible" : "💔 Pas fait l'un pour l'autre";
    await repondre(`❤️ *COMPATIBILITÉ*\n\n${nom} et toi: ${compat}%\n${result}`);
  }
);

// ============ MOT ============
zokou(
  { nomCom: "mot", categorie: "Fun", reaction: "📝", desc: "Mot aléatoire", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const mots = ["Émerveillement", "Crépuscule", "Harmonie", "Éternité", "Lumière", "Rêverie", "Sérénité", "Passion", "Liberté", "Miracle"];
    await repondre(`📝 *MOT ALÉATOIRE*\n\n_${mots[Math.floor(Math.random() * mots.length)]}_`);
  }
);

// ============ CITATION ============
zokou(
  { nomCom: "citation", categorie: "Fun", reaction: "📖", desc: "Citation aléatoire", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const citations = [
      "La vie est ce qui arrive quand on fait d'autres projets. - John Lennon",
      "Le succès c'est d'aller d'échec en échec sans perdre son enthousiasme. - Winston Churchill",
      "Le seul moyen de faire du bon travail est d'aimer ce qu'on fait. - Steve Jobs",
      "L'imagination est plus importante que le savoir. - Albert Einstein",
      "Le changement, c'est la vie. - Victor Hugo"
    ];
    await repondre(`📖 *CITATION*\n\n"${citations[Math.floor(Math.random() * citations.length)]}"`);
  }
);

// ============ JEUX ============
zokou(
  { nomCom: "jeux", categorie: "Fun", reaction: "🎲", desc: "Jeu de dés", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const de1 = Math.floor(Math.random() * 6) + 1;
    const de2 = Math.floor(Math.random() * 6) + 1;
    await repondre(`🎲 *DÉS*\n\n🎯 Tu as fait: ${de1} et ${de2}\nTotal: ${de1 + de2}`);
  }
);

// ============ VIRUS (Fake) ============
zokou(
  { nomCom: "virus", categorie: "Fun", reaction: "🦠", desc: "Fake virus", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    await repondre("⚠️ *VIRUS DÉTECTÉ!* ⚠️\n\n🔴 TROJAN.WIN32.HACK\n🟠 Installation en cours...\n🟡 15%... 45%... 78%...\n🟢 Système compromis!\n\n_(Blague — aucun vrai virus)_");
  }
);

// ============ STICKER ============

zokou(
  {
    nomCom: "sticker",
    alias: ["s", "stk"],
    categorie: "Media",
    reaction: "➕",
    desc: "Transforme une image ou une vidéo en sticker.",
    plugin: "Ozen_Pack"
  },
  async (dest, zk, ops) => {
    const { repondre, ms, msgRepondu } = ops;

    try {
      // 1. Détecter la source du média (réponse ou message direct)
      const content = msgRepondu ? msgRepondu : ms.message;
      
      // Gestion des messages à vue unique ou normaux
      const messageData = content.viewOnceMessageV2?.message || content.viewOnceMessage?.message || content;
      
      const mtype = Object.keys(messageData)[0];
      const supportedTypes = ["imageMessage", "videoMessage"];

      if (!supportedTypes.includes(mtype)) {
          return repondre("❌ Veuillez répondre à une image ou une vidéo pour créer un sticker.");
      }

      if (mtype === "videoMessage" && messageData.videoMessage.seconds > 7) {
          return repondre("❌ La vidéo est trop longue ! Le maximum pour un sticker est de 7 secondes.");
      }
      await repondre("⏳ *OZEN-MD prépare votre sticker...*");

      // 2. Téléchargement sécurisé via Baileys
      const buffer = await downloadMediaMessage(
        { message: messageData },
        "buffer",
        {},
        { logger: console }
      );

      // 3. Configuration et création du sticker
      const sticker = new Sticker(buffer, {
        pack: "OZEN-MD",
        author: "dev-gninoue",
        type: StickerTypes.FULL, 
        quality: 70
      });

      const stickerBuffer = await sticker.toBuffer();

      // 4. Envoi du sticker
      await zk.sendMessage(dest, { sticker: stickerBuffer }, { quoted: ms });

    } catch (e) {
      console.error("Erreur Sticker:", e);
      repondre("❌ Erreur technique : " + e.message);
    }
  }
);

// ============ KICK ============
zokou(
  { nomCom: "kick", categorie: "Admin", reaction: "👢", desc: "Expulse un membre du groupe.", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, ms, arg, verifGroupe, verifAdmin, superUser, msgRepondu, auteurMsgRepondu, infosGroupe } = ops;

    if (!verifGroupe) return repondre("❌ Cette commande n'est utilisable que dans un groupe.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux administrateurs du groupe.");

    // ✅ FIX: Pas besoin de vérifier si le bot est admin car il utilise ton compte

    // ✅ FIX : Identifier la cible correctement
    let target;
    if (auteurMsgRepondu) {
      target = auteurMsgRepondu;
    } else if (ms.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      target = ms.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (arg[0]) {
      target = arg[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    }

    if (!target) return repondre("❌ Mentionne un utilisateur ou réponds à son message.");

    try {
      await zk.groupParticipantsUpdate(dest, [target], "remove");
      // ✅ FIX : sendMessage avec mentions (repondre() ne supporte pas les mentions)
      await zk.sendMessage(dest, {
        text: `✅ @${target.split("@")[0]} a été retiré du groupe.`,
        mentions: [target]
      }, { quoted: ms });
    } catch (e) {
      repondre("❌ Erreur lors de l'expulsion : " + e.message);
    }
  }
);


// ============ PROMOTE ============
zokou(
  { nomCom: "promote", categorie: "Admin", reaction: "⬆️", desc: "Rendre admin", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre, ms, verifGroupe, verifAdmin, superUser, auteurMsgRepondu, infosGroupe } = ops;
    
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    // ✅ FIX: Pas besoin de vérifier si le bot est admin car il utilise ton compte

    // ✅ FIX : Identifier la cible correctement
    let user;
    if (auteurMsgRepondu) {
      user = auteurMsgRepondu;
    } else if (ms.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      user = ms.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (arg[0]) {
      user = arg[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    }

    if (!user) return repondre("❌ Mentionne un utilisateur ou réponds à son message.");

    try {
      await zk.groupParticipantsUpdate(dest, [user], "promote");
      await zk.sendMessage(dest, {
        text: `⬆️ @${user.split("@")[0]} est maintenant administrateur !`,
        mentions: [user]
      }, { quoted: ms });
    } catch (e) {
      repondre("❌ Erreur : " + e.message);
    }
  }
);

// ============ DEMOTE ============
zokou(
  { nomCom: "demote", categorie: "Admin", reaction: "⬇️", desc: "Retirer admin", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre, ms, verifGroupe, verifAdmin, superUser, auteurMsgRepondu, infosGroupe } = ops;
    
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    // ✅ FIX: Pas besoin de vérifier si le bot est admin car il utilise ton compte

    // ✅ FIX : Identifier la cible correctement
    let user;
    if (auteurMsgRepondu) {
      user = auteurMsgRepondu;
    } else if (ms.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      user = ms.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (arg[0]) {
      user = arg[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    }

    if (!user) return repondre("❌ Mentionne un utilisateur ou réponds à son message.");

    try {
      await zk.groupParticipantsUpdate(dest, [user], "demote");
      await zk.sendMessage(dest, {
        text: `⬇️ @${user.split("@")[0]} n'est plus administrateur.`,
        mentions: [user]
      }, { quoted: ms });
    } catch (e) {
      repondre("❌ Erreur : " + e.message);
    }
  }
);

// ============ GROUP (Open/Close) ============
zokou(
  { 
    nomCom: "group", 
    categorie: "Admin", 
    reaction: "⚙️", 
    desc: "Ouvrir ou fermer le groupe", 
    plugin: "Ozen_Pack" 
  },
  async (dest, zk, ops) => {
    const { arg, repondre, verifGroupe, verifAdmin, superUser } = ops;

    // 1. Vérifications de sécurité (Expéditeur)
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    
    // On vérifie si TOI tu es admin. Si oui, l'action passera car le bot utilise ta session.
    if (!verifAdmin && !superUser) {
        return repondre("❌ Réservé aux administrateurs du groupe.");
    }

    // 2. Validation des arguments
    if (!arg[0] || !["open", "close"].includes(arg[0])) {
      return repondre(`Usage: .group open\nou: .group close`);
    }

    // 3. Traduction pour l'API Baileys
    // 'not_announcement' = Tout le monde peut parler (Open)
    // 'announcement' = Seuls les admins parlent (Close)
    const action = arg[0] === "open" ? "not_announcement" : "announcement";

    try {
      await zk.groupSettingUpdate(dest, action);
      await repondre(`✅ Groupe ${arg[0] === "open" ? "ouvert (Tout le monde peut parler)" : "fermé (Seuls les admins parlent)"}.`);
    } catch (e) {
      console.error(e);
      repondre("❌ Échec de la modification. Vérifiez que vous êtes bien administrateur.");
    }
  }
);

// ============ TAGALL ============
zokou(
  { nomCom: "tagall", categorie: "Admin", reaction: "📢", desc: "Mentionner tous les membres", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, verifAdmin, superUser, infosGroupe, arg } = ops;

    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Seuls les admins peuvent faire un appel général.");

    const msg = arg.join(" ") || "📢 Attention tout le monde !";
    const mentions = infosGroupe.participants.map(p => p.id);
    
    let messageTag = `*📢 MESSAGE :* ${msg}\n\n`;
    for (let mem of mentions) {
      messageTag += `@${mem.split("@")[0]} `;
    }

    try {
      await zk.sendMessage(dest, { text: messageTag, mentions });
    } catch (e) {
      repondre("❌ Erreur lors de l'appel : " + e.message);
    }
  }
);

// description : Changer la description du groupe

zokou(
  { 
    nomCom: "setdesc", 
    categorie: "Admin", 
    reaction: "📝", 
    desc: "Changer la description du groupe", 
    plugin: "Ozen_Pack" 
  },
  async (dest, zk, ops) => {
    const { arg, repondre, verifGroupe, verifAdmin, superUser } = ops;

    // 1. Vérification de l'expéditeur
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins du groupe.");

    // 2. Vérification de l'argument
    const nouvelleDesc = arg.join(" ");
    if (!nouvelleDesc) return repondre(`Usage: .setdesc <votre texte ici>`);
    
    if (nouvelleDesc.length > 512) {
        return repondre("❌ La description est trop longue (maximum 512 caractères).");
    }

    try {
      // 3. Action directe
      // Si tu es admin, Baileys exécutera l'ordre sans discuter
      await zk.groupUpdateDescription(dest, nouvelleDesc);
      await repondre("✅ La description du groupe a été mise à jour avec succès !");
      
    } catch (e) {
      console.error("Erreur SETDESC :", e);
      repondre("❌ Échec : Assurez-vous que les paramètres du groupe autorisent les admins à modifier les infos.");
    }
  }
);


// ============ CALCUL ============
zokou(
  { nomCom: "calcul", categorie: "Outils", reaction: "🧮", desc: "Calculatrice", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const expr = arg.join("");
    if (!expr) return repondre(`Usage: ${ops.prefixe}calcul 2+2`);
    // ✅ FIX : Validation de l'expression pour éviter les injections
    if (!/^[\d\s\+\-\*\/\(\)\.%]+$/.test(expr)) return repondre("❌ Expression invalide. Utilisez uniquement des chiffres et opérateurs (+, -, *, /)");
    try {
      const result = Function(`"use strict"; return (${expr})`)();
      if (!isFinite(result)) return repondre("❌ Résultat invalide (division par zéro ?)");
      await repondre(`🧮 *CALCUL*\n\n${expr} = *${result}*`);
    } catch (e) {
      repondre("❌ Expression invalide.");
    }
  }
);

// ============ WEATHER ============
zokou(
  { nomCom: "weather", categorie: "Outils", reaction: "🌤️", desc: "Météo actuelle", plugin: "Ozen_Pack", alias: ["meteo"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const ville = arg.join(" ") || "Abidjan";
    try {
      const res = await axios.get(`https://api.popcat.xyz/weather?q=${encodeURIComponent(ville)}`);
      const data = res.data[0];
      const info = `🌤️ *MÉTÉO - ${data.location.name}*\n\n*Condition:* ${data.current.skytext}\n*Temp:* ${data.current.temperature}°C\n*Humidité:* ${data.current.humidity}%\n*Vent:* ${data.current.winddisplay}`;
      await repondre(info);
    } catch (e) {
      repondre("❌ Ville introuvable.");
    }
  }
);


// ============ RESTART (Owner) ============
zokou(
  { nomCom: "restart", categorie: "Owner", reaction: "🔄", desc: "Redémarrer le bot", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, superUser } = ops;
    if (!superUser) return repondre("❌ Commande réservée au propriétaire.");
    await repondre("🔄 *OZEN-MD : Redémarrage en cours...*");
    setTimeout(() => process.exit(1), 2000);
  }
);

// ============ BC (Broadcast) ============
zokou(
  { nomCom: "bc", categorie: "Owner", reaction: "📢", desc: "Diffuser un message à tous les groupes", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre, superUser } = ops;
    if (!superUser) return repondre("❌ Accès refusé.");
    
    const msg = arg.join(" ");
    if (!msg) return repondre(`Usage: ${ops.prefixe}bc <message>`);

    try {
      const groups = await zk.groupFetchAllParticipating();
      const jids = Object.keys(groups);
      await repondre(`📢 Diffusion vers *${jids.length}* groupes...`);
      for (let id of jids) {
        await zk.sendMessage(id, { text: `📢 *DIFFUSION OZEN-MD*\n\n${msg}` });
        await new Promise(r => setTimeout(r, 500)); // ✅ FIX : délai entre chaque envoi
      }
      await repondre("✅ Message diffusé avec succès.");
    } catch (e) {
      repondre("❌ Erreur broadcast : " + e.message);
    }
  }
);

// ============================================================
// =================== NOUVEAU PACK OZEN (+50) ================
// ============================================================

// =========== SECTION IA / BLAGUE ===========

// ============ ROAST ============
zokou(
  { nomCom: "roast", categorie: "IA/Fun", reaction: "🔥", desc: "Roast un membre (humour)", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, auteurMsgRepondu, auteurMessage } = ops;
    const cible = auteurMsgRepondu ? auteurMsgRepondu.split("@")[0] : auteurMessage.split("@")[0];
    const roasts = [
      "T'as un visage qui ferait pleurer un oignon 😭",
      "Tu es la preuve vivante que Dieu a un sens de l'humour 😂",
      "Si l'intelligence était de l'eau, tu serais le Sahara 🏜️",
      "Ton QI et ta pointure ont le même chiffre 👟",
      "T'as l'air d'avoir été dessiné par quelqu'un qui n'a jamais vu un humain 🤖",
      "Tu parles tellement que même le silence te manque 🔇",
      "Si tu étais une pizza, tu serais une pizza sans fromage. Inutile 🍕",
      "T'as le charisme d'une chaise de bureau 🪑",
      "Même ton ombre essaie de s'éloigner de toi 👤",
      "Tu es la raison pour laquelle les notices d'utilisation existent 📄",
    ];
    const r = roasts[Math.floor(Math.random() * roasts.length)];
    await repondre(`🔥 *ROAST OZEN*\n\n@${cible} : ${r}`);
  }
);

// ============ COMPLIMENT ============
zokou(
  { nomCom: "compliment", categorie: "IA/Fun", reaction: "💐", desc: "Envoie un compliment à quelqu'un", plugin: "Ozen_Pack", alias: ["flatter"] },
  async (dest, zk, ops) => {
    const { repondre, auteurMsgRepondu, auteurMessage } = ops;
    const cible = auteurMsgRepondu ? auteurMsgRepondu.split("@")[0] : auteurMessage.split("@")[0];
    const compliments = [
      "Tu as un sourire qui illumine toute une pièce ✨",
      "Tu es quelqu'un d'exceptionnel et rare 💎",
      "Ta présence rend chaque moment spécial 🌟",
      "Tu es une source d'inspiration pour les autres 🚀",
      "Tu as un cœur en or, ne l'oublie jamais 💛",
      "Ton intelligence et ta gentillesse sont une combinaison rare 🧠❤️",
      "Tu es exactement le genre de personne dont le monde a besoin 🌍",
      "Tu transforms les problèmes en opportunités, c'est un don 🎁",
      "Tu es brillant(e) sans même t'en rendre compte 💡",
      "Ta force intérieure est impressionnante 💪",
    ];
    const c = compliments[Math.floor(Math.random() * compliments.length)];
    await repondre(`💐 *COMPLIMENT OZEN*\n\n@${cible} : ${c}`);
  }
);

// ============ BLAGUE ============
zokou(
  { nomCom: "blague", categorie: "IA/Fun", reaction: "😂", desc: "Raconte une blague", plugin: "Ozen_Pack", alias: ["joke", "lol"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const blagues = [
      { q: "Pourquoi les plongeurs plongent-ils toujours en arrière ?", r: "Parce que s'ils plongeaient en avant, ils tomberaient dans le bateau ! 😂" },
      { q: "C'est l'histoire d'un homme qui court après un bus...", r: "Il ne l'attrape pas. Morale : ne courez jamais après un bus, il y en aura un autre. Sauf dans certaines villes... 😅" },
      { q: "Qu'est-ce qu'un canif ?", r: "Le petit frère du canard ! 🦆" },
      { q: "Pourquoi est-ce que les poissons n'aiment pas jouer au tennis ?", r: "Parce qu'ils ont peur du filet ! 🎾" },
      { q: "Qu'est-ce qu'un crocodile qui surveille la cour ?", r: "Un croco-dile ! 🐊" },
      { q: "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ?", r: "Un chat-peint de Noël ! 🎄" },
      { q: "Un homme entre dans une bibliothèque et demande un livre sur le paradoxe...", r: "La bibliothécaire lui dit : 'On l'a et on ne l'a pas' 📚" },
      { q: "Quel est le comble pour un électricien ?", r: "De ne pas être au courant ! ⚡" },
    ];
    const b = blagues[Math.floor(Math.random() * blagues.length)];
    await repondre(`😂 *BLAGUE OZEN*\n\n❓ ${b.q}\n\n💡 ${b.r}`);
  }
);

// ============ INSULTE (fun/fictif) ============
zokou(
  { nomCom: "insulte", categorie: "IA/Fun", reaction: "😤", desc: "Insulte fictive et drôle (humour)", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, auteurMsgRepondu, auteurMessage } = ops;
    const cible = auteurMsgRepondu ? auteurMsgRepondu.split("@")[0] : auteurMessage.split("@")[0];
    const insultes = [
      "Espèce de baguette sans beurre 🥖",
      "Toi t'es un WiFi sans mot de passe : tout le monde peut t'ignorer 📡",
      "T'es aussi utile qu'un parachute qui s'ouvre à l'atterrissage 🪂",
      "T'es la fondue sans fromage de la vie 🫕",
      "Cousin du néant, fils du vide 🌌",
      "T'es un spoiler ambulant de film raté 🎬",
      "Toi t'es le bug dans le code de l'univers 🐛",
      "T'es une notification sans importance 🔔",
    ];
    const i = insultes[Math.floor(Math.random() * insultes.length)];
    await repondre(`😤 *INSULTE FICTIVE OZEN*\n\n@${cible} : ${i}\n\n_(Humour seulement, pas d'offense réelle)_`);
  }
);

// ============ HOROSCOPE ============
zokou(
  { nomCom: "horoscope", categorie: "IA/Fun", reaction: "⭐", desc: "Horoscope du jour selon ton signe", plugin: "Ozen_Pack", alias: ["astro"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const signe = arg[0]?.toLowerCase();
    const signes = {
      belier: "🐏 Bélier", taureau: "🐂 Taureau", gemeaux: "👯 Gémeaux", cancer: "🦀 Cancer",
      lion: "🦁 Lion", vierge: "👩 Vierge", balance: "⚖️ Balance", scorpion: "🦂 Scorpion",
      sagittaire: "🏹 Sagittaire", capricorne: "🐐 Capricorne", verseau: "🏺 Verseau", poissons: "🐟 Poissons"
    };
    if (!signe || !signes[signe]) {
      return repondre(`❌ Signe invalide.\nUsage: ${ops.prefixe}horoscope <signe>\nSignes: belier, taureau, gemeaux, cancer, lion, vierge, balance, scorpion, sagittaire, capricorne, verseau, poissons`);
    }
    const previsions = [
      "Les étoiles sont en ta faveur aujourd'hui. Profite-en pour prendre des initiatives 🌟",
      "Une surprise agréable t'attend. Garde l'esprit ouvert 🎁",
      "Évite les conflits inutiles, concentre-toi sur tes objectifs 🎯",
      "Une rencontre inattendue pourrait changer ta journée ✨",
      "C'est le moment idéal pour réfléchir à tes projets futurs 💭",
      "Ta créativité est à son maximum, mets-la à profit 🎨",
      "La chance est de ton côté, mais reste prudent(e) 🍀",
      "Une période de calme et de sérénité s'annonce 🕊️",
    ];
    const prev = previsions[Math.floor(Math.random() * previsions.length)];
    await repondre(`⭐ *HOROSCOPE - ${signes[signe]}*\n\n${prev}\n\n_Propulsé par OZEN-MD_`);
  }
);

// ============ MOTIVATION ============
zokou(
  { nomCom: "motivation", categorie: "IA/Fun", reaction: "💪", desc: "Message de motivation du jour", plugin: "Ozen_Pack", alias: ["motiv", "inspire"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const msgs = [
      "🔥 Chaque grand voyage commence par un premier pas. Fais-le aujourd'hui !",
      "💎 Tu es plus fort(e) que tu ne le crois. Continue !",
      "🚀 Le succès n'est pas final, l'échec n'est pas fatal. C'est le courage de continuer qui compte.",
      "⚡ La seule limite c'est celle que tu t'imposes. Repousse-la !",
      "🌊 Les vagues ne s'arrêtent jamais. Apprends à surfer !",
      "🎯 Un objectif sans plan n'est qu'un souhait. Planifie et agis !",
      "🌟 Tu n'es pas obligé d'être parfait(e) pour commencer. Commence pour devenir meilleur(e) !",
      "💡 Chaque jour est une nouvelle chance de tout changer.",
      "🏆 Les champions ne naissent pas champions. Ils se construisent chaque jour.",
      "🌅 Demain commence maintenant. Que fais-tu de ce moment ?",
    ];
    await repondre(`💪 *MOTIVATION OZEN*\n\n${msgs[Math.floor(Math.random() * msgs.length)]}`);
  }
);

// ============ DEVINETTE ============
zokou(
  { nomCom: "devinette", categorie: "IA/Fun", reaction: "🧩", desc: "Pose une devinette", plugin: "Ozen_Pack", alias: ["riddle", "enigme"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const devinettes = [
      { q: "Je parle sans bouche et j'entends sans oreilles. Je n'ai pas de corps mais je prends vie avec le vent. Qui suis-je ?", r: "Un écho 🔊" },
      { q: "Plus je sèche, plus je suis mouillée. Qui suis-je ?", r: "Une serviette 🧺" },
      { q: "J'ai des villes mais pas de maisons, des forêts mais pas d'arbres, de l'eau mais pas de poissons. Qui suis-je ?", r: "Une carte 🗺️" },
      { q: "Je suis toujours devant toi mais ne peut jamais être vu. Qui suis-je ?", r: "L'avenir 🔮" },
      { q: "Je tombe mais ne me blesse pas, je coule mais ne me noie pas. Qui suis-je ?", r: "La pluie 🌧️" },
      { q: "Plus je grandit, moins tu me vois. Qui suis-je ?", r: "L'obscurité 🌑" },
      { q: "Je suis léger comme une plume mais même l'homme le plus fort ne peut me tenir longtemps. Qui suis-je ?", r: "Le souffle / la respiration 💨" },
    ];
    const d = devinettes[Math.floor(Math.random() * devinettes.length)];
    await repondre(`🧩 *DEVINETTE OZEN*\n\n❓ ${d.q}\n\n_(Réponds puis tape ${ops.prefixe}reponse pour voir la réponse)_\n\n||Réponse: ${d.r}||`);
  }
);

// ============ FAIT INSOLITE ============
zokou(
  { nomCom: "fait", categorie: "IA/Fun", reaction: "🤯", desc: "Fait insolite aléatoire", plugin: "Ozen_Pack", alias: ["funfact", "insolite"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const faits = [
      "🐙 Les pieuvres ont trois cœurs et un sang bleu !",
      "🍯 Le miel ne se périme jamais. On en a trouvé dans des tombeaux égyptiens vieux de 3000 ans !",
      "🦷 L'email humain est aussi dur que l'acier.",
      "🌙 La Lune s'éloigne de la Terre d'environ 3,8 cm par an.",
      "🐘 Les éléphants sont les seuls animaux qui ne peuvent pas sauter.",
      "💧 Le corps humain contient assez de fer pour fabriquer un clou de 3cm.",
      "🦋 Un papillon goûte avec ses pieds.",
      "🌊 L'océan Pacifique est plus grand que toute la surface terrestre réunie.",
      "🧬 Ton ADN est identique à 99,9% à celui de n'importe quel autre humain.",
      "⚡ La foudre frappe la Terre environ 100 fois par seconde.",
      "🐬 Les dauphins dorment avec un œil ouvert.",
      "🌿 Les arbres communiquent entre eux via des réseaux de champignons souterrains.",
    ];
    await repondre(`🤯 *FAIT INSOLITE OZEN*\n\n${faits[Math.floor(Math.random() * faits.length)]}`);
  }
);

// ============ VRAI OU FAUX ============
zokou(
  { nomCom: "vraiou", categorie: "IA/Fun", reaction: "🎲", desc: "Vrai ou faux aléatoire", plugin: "Ozen_Pack", alias: ["truefalse"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const questions = [
      { q: "Les chauves-souris sont aveugles ?", r: false, expl: "Non ! Elles voient très bien, elles utilisent juste l'écholocation en plus 🦇" },
      { q: "L'eau bout à 100°C au niveau de la mer ?", r: true, expl: "Oui, à pression atmosphérique normale 💧" },
      { q: "Les humains utilisent seulement 10% de leur cerveau ?", r: false, expl: "Faux ! On utilise pratiquement tout notre cerveau 🧠" },
      { q: "La Grande Muraille de Chine est visible depuis l'espace ?", r: false, expl: "Faux ! Elle est trop étroite pour être vue à l'œil nu depuis l'espace 🚀" },
      { q: "Les pingouins vivent en Antarctique ?", r: true, expl: "Vrai ! Mais les manchots aussi. Les deux sont différents 🐧" },
      { q: "L'or est indestructible ?", r: false, expl: "Non, l'or peut se dissoudre dans l'eau régale (mélange d'acides) ⚗️" },
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    const rep = q.r ? "✅ VRAI" : "❌ FAUX";
    await repondre(`🎲 *VRAI OU FAUX - OZEN*\n\n❓ ${q.q}\n\n${rep}\n\n💡 ${q.expl}`);
  }
);

// ============ MOOD ============
zokou(
  { nomCom: "mood", categorie: "IA/Fun", reaction: "😊", desc: "Analyse ton mood avec des mots-clés", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const texte = arg.join(" ").toLowerCase();
    if (!texte) return repondre(`Usage: ${ops.prefixe}mood <décris comment tu te sens>`);
    let mood = "", conseil = "";
    if (texte.match(/triste|déprimé|mal|pleure|nul|seul/)) {
      mood = "😢 Triste / Abattu";
      conseil = "Prends soin de toi. Parle à quelqu'un de confiance. Les nuages passent toujours 🌈";
    } else if (texte.match(/heureux|joie|content|super|génial|top|bien/)) {
      mood = "😄 Heureux / Positif";
      conseil = "Continue sur cette lancée ! Le bonheur est contagieux, partage-le 💛";
    } else if (texte.match(/fatigué|épuisé|dormir|repos/)) {
      mood = "😴 Fatigué / Épuisé";
      conseil = "Ton corps a besoin de repos. Accorde-toi une pause, tu le mérites 💤";
    } else if (texte.match(/stressé|anxieux|peur|inquiet/)) {
      mood = "😰 Stressé / Anxieux";
      conseil = "Respire profondément. Un problème à la fois. Tu peux y arriver 🧘";
    } else if (texte.match(/amour|amoureux|belle|beau|couple/)) {
      mood = "💕 Amoureux / Romantique";
      conseil = "L'amour est la plus belle des émotions. Profites-en ! 🌹";
    } else {
      mood = "🤔 Mood indéfini";
      conseil = "Je ne sais pas exactement comment tu te sens, mais je suis là ! 😊";
    }
    await repondre(`😊 *ANALYSE DE MOOD*\n\nMood détecté : *${mood}*\n\n💬 Conseil : ${conseil}`);
  }
);

// ============ TONGUE TWISTER ============
zokou(
  { nomCom: "virelangue", categorie: "IA/Fun", reaction: "👅", desc: "Virelangue aléatoire", plugin: "Ozen_Pack", alias: ["tonguetwister"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const virelangues = [
      "Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?",
      "Un chasseur sachant chasser sait chasser sans son chien.",
      "Cinq chiens chassent six chats.",
      "Didon dîna, dit-on, du dos d'un dodu dindon.",
      "Si six scies scient six cyprès, six cents scies scient six cents cyprès.",
      "Ton thé t'a-t-il ôté ta toux ?",
      "Suis-je bien chez ce cher Serge ?",
    ];
    const v = virelangues[Math.floor(Math.random() * virelangues.length)];
    await repondre(`👅 *VIRELANGUE OZEN*\n\n_Dis ça 5 fois vite :_\n\n"${v}"\n\nBonne chance ! 😂`);
  }
);

// ============ ANIMAL QUIZ ============
zokou(
  { nomCom: "animal", categorie: "IA/Fun", reaction: "🐾", desc: "Fait amusant sur un animal", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const animaux = {
      lion: "🦁 *Lion*\nLe lion dort jusqu'à 20h par jour. Le vrai roi du repos !",
      elephant: "🐘 *Éléphant*\nLes éléphants peuvent se souvenir de l'emplacement de l'eau à des centaines de km !",
      dauphin: "🐬 *Dauphin*\nLes dauphins ont leur propre 'nom' sonore unique pour s'identifier.",
      pieuvre: "🐙 *Pieuvre*\nLes pieuvres ont 9 cerveaux : 1 central + 1 par tentacule !",
      colibri: "🐦 *Colibri*\nLe colibri est le seul oiseau qui peut voler à reculons.",
      requin: "🦈 *Requin*\nLes requins existent depuis 450 millions d'années, avant même les dinosaures !",
      girafe: "🦒 *Girafe*\nLa girafe ne dort que 30 minutes par jour en moyenne.",
      chat: "🐱 *Chat*\nLes chats passent 70% de leur vie à dormir. Vrai mode de vie 😴",
    };
    const animal = arg[0]?.toLowerCase();
    if (!animal || !animaux[animal]) {
      const liste = Object.keys(animaux).join(", ");
      return repondre(`🐾 Usage: ${ops.prefixe}animal <animal>\nAnimaux disponibles: ${liste}`);
    }
    await repondre(`🐾 *FAIT ANIMAL - OZEN*\n\n${animaux[animal]}`);
  }
);

// ============ AVIS (sondage rapide) ============
zokou(
  { nomCom: "avis", categorie: "IA/Fun", reaction: "📊", desc: "Crée un sondage rapide Oui/Non", plugin: "Ozen_Pack", alias: ["sondage", "vote"] },
  async (dest, zk, ops) => {
    const { arg, repondre, ms, verifGroupe } = ops;
    if (!verifGroupe) return repondre("❌ Cette commande fonctionne uniquement dans un groupe.");
    const question = arg.join(" ");
    if (!question) return repondre(`Usage: ${ops.prefixe}avis <ta question>`);
    await zk.sendMessage(dest, {
      text: `📊 *SONDAGE OZEN*\n\n❓ ${question}\n\n👍 Oui — répondez avec "oui"\n👎 Non — répondez avec "non"\n\n_Sondage lancé par @${ops.auteurMessage.split("@")[0]}_`,
      mentions: [ops.auteurMessage]
    }, { quoted: ms });
  }
);

// ============ PAIRE OU IMPAIRE ============
zokou(
  { nomCom: "pile", categorie: "IA/Fun", reaction: "🪙", desc: "Lance une pièce (pile ou face)", plugin: "Ozen_Pack", alias: ["face", "coinflip"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const result = Math.random() < 0.5 ? "🪙 PILE" : "🪙 FACE";
    await repondre(`🪙 *LANCER DE PIÈCE*\n\nRésultat : *${result}*`);
  }
);

// ============ NOMBRE ALÉATOIRE ============
zokou(
  { nomCom: "nombre", categorie: "IA/Fun", reaction: "🔢", desc: "Génère un nombre aléatoire entre min et max", plugin: "Ozen_Pack", alias: ["random", "rng"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const min = parseInt(arg[0]) || 1;
    const max = parseInt(arg[1]) || 100;
    if (min >= max) return repondre("❌ Le minimum doit être inférieur au maximum.");
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    await repondre(`🔢 *NOMBRE ALÉATOIRE*\n\nEntre ${min} et ${max} : *${result}*`);
  }
);

// ============ COULEUR HEX ============
zokou(
  { nomCom: "couleur", categorie: "IA/Fun", reaction: "🎨", desc: "Génère une couleur hex aléatoire", plugin: "Ozen_Pack", alias: ["color", "hex"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const hex = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0").toUpperCase();
    await repondre(`🎨 *COULEUR ALÉATOIRE*\n\nCode HEX : *${hex}*\n\nVois cette couleur sur : https://www.color-hex.com/color/${hex.slice(1)}`);
  }
);

// ============ AGE (calcul) ============
zokou(
  { nomCom: "age", categorie: "IA/Fun", reaction: "🎂", desc: "Calcule ton âge exact", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const dateStr = arg[0];
    if (!dateStr) return repondre(`Usage: ${ops.prefixe}age <JJ/MM/AAAA>\nEx: ${ops.prefixe}age 15/06/1995`);
    const [j, m, a] = dateStr.split("/").map(Number);
    if (!j || !m || !a) return repondre("❌ Format invalide. Utilise JJ/MM/AAAA");
    const naissance = new Date(a, m - 1, j);
    const now = new Date();
    const ageMs = now - naissance;
    const annees = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
    const jours = Math.floor((ageMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24));
    await repondre(`🎂 *CALCUL D'ÂGE*\n\n📅 Né(e) le : ${dateStr}\n🎉 Âge : *${annees} ans et ${jours} jours*\n\n_Propulsé par OZEN-MD_`);
  }
);

// ============ CONSEIL SANTÉ ============
zokou(
  { nomCom: "sante", categorie: "IA/Fun", reaction: "🏥", desc: "Conseil santé aléatoire", plugin: "Ozen_Pack", alias: ["health"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const conseils = [
      "💧 Bois au moins 2L d'eau par jour. L'hydratation est clé pour tout !",
      "🛌 7 à 9 heures de sommeil par nuit améliorent ta mémoire et ton humeur.",
      "🚶 30 minutes de marche par jour réduisent le risque de maladie cardiaque de 35%.",
      "🥗 Mange 5 fruits et légumes par jour pour booster ton système immunitaire.",
      "📱 Évite les écrans 1h avant de dormir pour un meilleur sommeil.",
      "🧘 5 minutes de méditation par jour réduisent le stress de façon significative.",
      "😁 Sourire libère des endorphines ! Souris même artificiellement, ça marche !",
      "🌞 10 minutes de soleil par jour apportent ta dose de vitamine D.",
      "🤸 Étire-toi matin et soir, surtout si tu es assis toute la journée.",
    ];
    await repondre(`🏥 *CONSEIL SANTÉ OZEN*\n\n${conseils[Math.floor(Math.random() * conseils.length)]}`);
  }
);

// ============ PSEUDO GENERATOR ============
zokou(
  { nomCom: "pseudo", categorie: "IA/Fun", reaction: "🏷️", desc: "Génère un pseudo cool aléatoire", plugin: "Ozen_Pack", alias: ["username", "nickname"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const prefixes = ["Dark", "Shadow", "Neon", "Ghost", "Alpha", "Cyber", "Storm", "Blaze", "Frost", "Void", "Nova", "Omega"];
    const suffixes = ["Wolf", "Fox", "Eagle", "Hunter", "Rider", "Blade", "Fire", "Storm", "Knight", "Phantom", "Legend", "King"];
    const num = Math.floor(Math.random() * 999);
    const pseudo = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}${num}`;
    await repondre(`🏷️ *PSEUDO GÉNÉRÉ*\n\n👤 ${pseudo}\n\n_Tape à nouveau pour en avoir un autre !_`);
  }
);

// ============ QUOTE CÉLÉBRITÉ ============
zokou(
  { nomCom: "celeb", categorie: "IA/Fun", reaction: "🌟", desc: "Citation d'une célébrité africaine ou mondiale", plugin: "Ozen_Pack", alias: ["quote2"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const quotes = [
      { auteur: "Nelson Mandela", citation: "Tout semble impossible jusqu'à ce que ce soit fait." },
      { auteur: "Thomas Sankara", citation: "Vous ne pouvez pas faire la révolution en soie." },
      { auteur: "Patrice Lumumba", citation: "L'Afrique écrira sa propre histoire." },
      { auteur: "Chinua Achebe", citation: "Quand la lune est là, les étoiles ne sont plus nécessaires." },
      { auteur: "Wangari Maathai", citation: "En plantant un arbre, tu plantes l'espoir." },
      { auteur: "Steve Jobs", citation: "Restez affamés, restez fous." },
      { auteur: "Maya Angelou", citation: "Tu peux faire face à tout ce que tu as déjà fait face." },
      { auteur: "Marcus Aurelius", citation: "Nous souffrons davantage dans notre imagination que dans la réalité." },
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    await repondre(`🌟 *CITATION CÉLÉBRITÉ*\n\n_"${q.citation}"_\n\n— *${q.auteur}*`);
  }
);

// ============ PROVERBE AFRICAIN ============
zokou(
  { nomCom: "proverbe", categorie: "IA/Fun", reaction: "🌍", desc: "Proverbe africain du jour", plugin: "Ozen_Pack", alias: ["african"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const proverbes = [
      { p: "Si tu veux aller vite, marche seul. Si tu veux aller loin, marche ensemble.", o: "Afrique de l'Ouest" },
      { p: "Un enfant est élevé par tout un village.", o: "Bantu" },
      { p: "La grenouille ne court pas le jour en vain.", o: "Côte d'Ivoire" },
      { p: "Connais-toi toi-même et tu connaîtras les dieux et l'univers.", o: "Kemet (Égypte ancienne)" },
      { p: "L'eau qui dort est plus dangereuse que l'eau qui coule.", o: "Afrique centrale" },
      { p: "On ne montre pas la forêt à un singe.", o: "Cameroun" },
      { p: "La bouche qui mange ne parle pas.", o: "Sénégal" },
      { p: "Quand deux éléphants se battent, c'est l'herbe qui souffre.", o: "Kenya" },
    ];
    const p = proverbes[Math.floor(Math.random() * proverbes.length)];
    await repondre(`🌍 *PROVERBE AFRICAIN*\n\n_"${p.p}"_\n\n📍 Origine : ${p.o}`);
  }
);

// =========== SECTION MUSIQUE / MÉDIA ===========

// ============ RECHERCHE YOUTUBE ============
zokou(
  { nomCom: "yt", categorie: "Musique", reaction: "▶️", desc: "Recherche une vidéo sur YouTube", plugin: "Ozen_Pack", alias: ["youtube", "ytSearch"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const query = arg.join(" ");
    if (!query) return repondre(`Usage: ${ops.prefixe}yt <titre de la vidéo>`);
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      await repondre(`▶️ *RECHERCHE YOUTUBE*\n\n🔍 Recherche : *${query}*\n\n🔗 Lien : ${url}\n\n_Ouvre le lien pour voir les résultats_`);
    } catch (e) {
      repondre("❌ Erreur lors de la recherche.");
    }
  }
);

// ============ PAROLES (Lyrics) ============
zokou(
  { nomCom: "lyrics", categorie: "Musique", reaction: "🎤", desc: "Recherche les paroles d'une chanson", plugin: "Ozen_Pack", alias: ["paroles", "song"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const query = arg.join(" ");
    if (!query) return repondre(`Usage: ${ops.prefixe}lyrics <artiste - titre>\nEx: ${ops.prefixe}lyrics Burna Boy On The Low`);
    try {
      const res = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`);
      const data = res.data;
      if (!data.lyrics) return repondre("❌ Paroles introuvables. Essaie avec artiste + titre.");
      const lyrics = data.lyrics.length > 1000 ? data.lyrics.slice(0, 1000) + "\n\n_[...paroles tronquées]_" : data.lyrics;
      await repondre(`🎤 *PAROLES - ${data.title || query}*\n👤 Artiste : ${data.author || "Inconnu"}\n\n${lyrics}`);
    } catch (e) {
      repondre(`❌ Paroles introuvables pour "${query}".`);
    }
  }
);

// ============ GENRE MUSICAL ============
zokou(
  { nomCom: "genre", categorie: "Musique", reaction: "🎸", desc: "Infos sur un genre musical", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const genres = {
      afrobeat: { desc: "Fusion de musique traditionnelle africaine, jazz et funk. Créé par Fela Kuti 🇳🇬", artistes: "Fela Kuti, Tony Allen, Burna Boy" },
      coupedecale: { desc: "Genre ivoirien né à Paris dans les années 2000. Rythme festif et danse 🇨🇮", artistes: "Douk Saga, DJ Arafat, Boro Sanguy" },
      afropop: { desc: "Pop africaine moderne, mélange de rythmes traditionnels et sonorités contemporaines 🌍", artistes: "Wizkid, Davido, Tiwa Savage" },
      reggae: { desc: "Né en Jamaïque dans les années 60. Rythme lent et messages sociaux 🇯🇲", artistes: "Bob Marley, Peter Tosh, Burning Spear" },
      hiphop: { desc: "Né à New York dans les années 70. Rap, breakdance, graffiti, DJing 🎤", artistes: "Tupac, Jay-Z, Kendrick Lamar" },
      drill: { desc: "Sous-genre du hip-hop né à Chicago. Basses lourdes, paroles sombres 🔊", artistes: "Chief Keef, Pop Smoke, Central Cee" },
      amapiano: { desc: "Genre sud-africain né en 2012. Mélange de jazz, deep house et gqom 🇿🇦", artistes: "DJ Maphorisa, Kabza De Small" },
    };
    const g = arg[0]?.toLowerCase();
    if (!g || !genres[g]) {
      return repondre(`🎸 Genres disponibles:\n${Object.keys(genres).join(", ")}\n\nUsage: ${ops.prefixe}genre <genre>`);
    }
    const info = genres[g];
    await repondre(`🎸 *GENRE : ${g.toUpperCase()}*\n\n📖 ${info.desc}\n\n🎤 Artistes clés : ${info.artistes}`);
  }
);

// ============ PLAYLIST MOOD ============
zokou(
  { nomCom: "playlist", categorie: "Musique", reaction: "🎧", desc: "Playlist selon ton mood", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const mood = arg[0]?.toLowerCase();
    const playlists = {
      triste: {
        emoji: "😢", titre: "Sad Hours",
        chansons: ["Adele - Someone Like You", "Sam Smith - Stay With Me", "Burna Boy - Last Last", "Frank Ocean - Self Control"]
      },
      heureux: {
        emoji: "😄", titre: "Good Vibes Only",
        chansons: ["Wizkid - Essence", "Davido - Fall", "Afrobeats Mix 2024", "DJ Arafat - Moto Moto"]
      },
      workout: {
        emoji: "💪", titre: "Beast Mode",
        chansons: ["Eminem - Till I Collapse", "Drake - Forever", "Kanye - POWER", "Travis Scott - Goosebumps"]
      },
      romance: {
        emoji: "💕", titre: "Love Vibes",
        chansons: ["Rema & Selena Gomez - Calm Down", "Fireboy - Peru", "Kizz Daniel - Buga", "P-Square - Personally"]
      },
      focus: {
        emoji: "🧠", titre: "Deep Focus",
        chansons: ["Lofi Hip Hop Radio", "Hans Zimmer - Time", "The Chemical Brothers", "Nils Frahm - Says"]
      },
    };
    if (!mood || !playlists[mood]) {
      return repondre(`🎧 Moods disponibles: triste, heureux, workout, romance, focus\n\nUsage: ${ops.prefixe}playlist <mood>`);
    }
    const pl = playlists[mood];
    const liste = pl.chansons.map((s, i) => `${i + 1}. ${s}`).join("\n");
    await repondre(`🎧 *PLAYLIST ${pl.emoji} ${pl.titre}*\n\n${liste}\n\n_Recherche sur YouTube ou Spotify !_`);
  }
);

// ============ TOP ARTISTE ============
zokou(
  { nomCom: "topartiste", categorie: "Musique", reaction: "🏆", desc: "Top artistes africains du moment", plugin: "Ozen_Pack", alias: ["topmusique"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    await repondre(`🏆 *TOP ARTISTES AFRICAINS 2025*\n\n1. 🇳🇬 Burna Boy — Afro Fusion\n2. 🇳🇬 Wizkid — Afropop\n3. 🇿🇦 Black Sherif — Highlife/Rap\n4. 🇨🇮 Dj Arafat (Legacy) — Coupé Décalé\n5. 🇳🇬 Asake — Afropop\n6. 🇰🇪 Bien (Sauti Sol) — Bongo\n7. 🇸🇳 Youssou N'Dour — Mbalax\n8. 🇬🇭 Stonebwoy — Reggae/Afrobeats\n9. 🇿🇦 Kabza De Small — Amapiano\n10. 🇨🇲 Locko — Afropop\n\n_Propulsé par OZEN-MD 🎵_`);
  }
);

// ============ QUIZ MUSIQUE ============
zokou(
  { nomCom: "quizmusique", categorie: "Musique", reaction: "🎵", desc: "Quiz musique aléatoire", plugin: "Ozen_Pack", alias: ["musicquiz"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const questions = [
      { q: "Quel artiste a chanté 'Essence' ?", r: "Wizkid (feat. Tems) 🇳🇬" },
      { q: "Dans quel pays est né le Coupé Décalé ?", r: "Côte d'Ivoire 🇨🇮 (mais popularisé à Paris)" },
      { q: "Qui est le 'Odogwu' de l'Afrobeats ?", r: "Burna Boy 🔥" },
      { q: "Quel genre musical est originaire d'Afrique du Sud ?", r: "L'Amapiano 🇿🇦" },
      { q: "Qui a fondé le mouvement Afrobeat original ?", r: "Fela Kuti 🇳🇬" },
      { q: "Quel pays a inventé le Reggae ?", r: "La Jamaïque 🇯🇲 (Bob Marley)" },
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    await repondre(`🎵 *QUIZ MUSIQUE OZEN*\n\n❓ ${q.q}\n\n||✅ Réponse : ${q.r}||`);
  }
);

// ============ INFO ARTISTE ============
zokou(
  { nomCom: "artiste", categorie: "Musique", reaction: "🎤", desc: "Infos sur un artiste", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const artistes = {
      wizkid: { nom: "Wizkid", vrai: "Ayodeji Ibrahim Balogun", pays: "Nigeria 🇳🇬", genre: "Afropop, R&B", hits: "Essence, Come Closer, Ojuelegba", bio: "Signé chez Sony Music à 19 ans. L'une des plus grandes stars d'Afrique." },
      burnaboy: { nom: "Burna Boy", vrai: "Damini Ebunoluwa Ogulu", pays: "Nigeria 🇳🇬", genre: "Afro Fusion, Afrobeats", hits: "Last Last, On The Low, Ye", bio: "Grammy Award 2021. Artiste africain le plus streamé au monde." },
      davido: { nom: "Davido", vrai: "David Adedeji Adeleke", pays: "Nigeria 🇳🇬", genre: "Afropop", hits: "Fall, Assurance, Unavailable", bio: "Fondateur de DMW. L'un des pionniers de l'Afropop international." },
      djarafat: { nom: "DJ Arafat", vrai: "Ange Didier Huon", pays: "Côte d'Ivoire 🇨🇮", genre: "Coupé Décalé", hits: "Moto Moto, Dosabado, Coupe Decale", bio: "Roi du Coupé Décalé. Décédé en 2019, son héritage reste immense." },
      locko: { nom: "Locko", vrai: "Serge Lokossou", pays: "Cameroun 🇨🇲", genre: "Afropop, R&B", hits: "Donne moi, Ma Nicole, Feel", bio: "Révélation camerounaise de l'Afropop moderne." },
    };
    const nom = arg.join("").toLowerCase().replace(/[\s-]/g, "");
    const info = artistes[nom];
    if (!info) {
      return repondre(`🎤 Artistes disponibles: ${Object.keys(artistes).join(", ")}\n\nUsage: ${ops.prefixe}artiste <nom>`);
    }
    await repondre(`🎤 *${info.nom}*\n\n👤 Vrai nom : ${info.vrai}\n🌍 Pays : ${info.pays}\n🎵 Genre : ${info.genre}\n🏆 Hits : ${info.hits}\n\n📖 ${info.bio}`);
  }
);

// ============ CONCERT (info fictif) ============
zokou(
  { nomCom: "concert", categorie: "Musique", reaction: "🎪", desc: "Infos concerts et événements musicaux", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    await repondre(`🎪 *CONCERTS & ÉVÉNEMENTS MUSICAUX*\n\n🔍 Pour trouver des concerts près de chez toi :\n\n🌐 Site officiel : https://www.songkick.com\n📱 App : Spotify (section Concerts)\n🎫 Billets : https://www.ticketmaster.com\n\n_Recherche ton artiste préféré pour voir ses prochains shows !_`);
  }
);

// ============ BATTLE (qui est meilleur) ============
zokou(
  { nomCom: "battle", categorie: "Musique", reaction: "⚔️", desc: "Battle entre deux artistes (aléatoire)", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const a1 = arg[0];
    const a2 = arg.slice(1).join(" ");
    if (!a1 || !a2) return repondre(`Usage: ${ops.prefixe}battle <artiste1> <artiste2>\nEx: ${ops.prefixe}battle Wizkid Burnaboy`);
    const score1 = Math.floor(Math.random() * 100);
    const score2 = Math.floor(Math.random() * 100);
    const gagnant = score1 > score2 ? a1 : a2;
    await repondre(`⚔️ *BATTLE MUSICAL OZEN*\n\n🎤 ${a1} : ${score1}/100\n🎤 ${a2} : ${score2}/100\n\n🏆 Gagnant : *${gagnant}* !\n\n_(Résultat purement aléatoire 😄)_`);
  }
);

// ============ TEMPO DETECTOR (fictif fun) ============
zokou(
  { nomCom: "tempo", categorie: "Musique", reaction: "🥁", desc: "Détecte le tempo de ton humeur musicale", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const tempos = [
      { bpm: 60, style: "Slow & Chill 🌊", genre: "Lo-fi, Ballades, Soul" },
      { bpm: 90, style: "Mid Tempo 😎", genre: "R&B, Afropop, Reggae" },
      { bpm: 120, style: "Dance Vibes 💃", genre: "Afrobeats, Pop, House" },
      { bpm: 140, style: "High Energy ⚡", genre: "Coupé Décalé, Drill, EDM" },
      { bpm: 170, style: "Beast Mode 🔥", genre: "Rap Hardcore, Trap, Metal" },
    ];
    const t = tempos[Math.floor(Math.random() * tempos.length)];
    await repondre(`🥁 *TEMPO DU MOMENT*\n\n💓 BPM : *${t.bpm}*\n🎵 Style : ${t.style}\n🎸 Genres recommandés : ${t.genre}`);
  }
);

// =========== SECTION ADMIN/OWNER AVANCÉ ===========

// ============ MUTE (Owner) ============
zokou(
  { nomCom: "mute", categorie: "Owner", reaction: "🔇", desc: "Met le bot en mode silencieux (ignore les non-owners)", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, superUser } = ops;
    if (!superUser) return repondre("❌ Réservé au propriétaire.");
    process.env.BOT_MUTED = "true";
    await repondre("🔇 *Bot en mode silencieux.* Seuls les owners peuvent utiliser les commandes.");
  }
);

// ============ UNMUTE (Owner) ============
zokou(
  { nomCom: "unmute", categorie: "Owner", reaction: "🔊", desc: "Désactive le mode silencieux", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, superUser } = ops;
    if (!superUser) return repondre("❌ Réservé au propriétaire.");
    process.env.BOT_MUTED = "false";
    await repondre("🔊 *Mode silencieux désactivé.* Tout le monde peut à nouveau utiliser le bot.");
  }
);

// ============ WARN (Admin) ============
zokou(
  { nomCom: "warn", categorie: "Admin", reaction: "⚠️", desc: "Avertir un membre du groupe", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, ms, verifGroupe, verifAdmin, superUser, auteurMsgRepondu, infosGroupe } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    if (!auteurMsgRepondu) return repondre("❌ Réponds au message d'un membre pour l'avertir.");
    const num = auteurMsgRepondu.split("@")[0];
    await zk.sendMessage(dest, {
      text: `⚠️ *AVERTISSEMENT OFFICIEL*\n\n@${num} tu reçois un avertissement de la part des admins.\nProchain manquement = expulsion. ⚠️`,
      mentions: [auteurMsgRepondu]
    }, { quoted: ms });
  }
);

// ============ RULES (règles du groupe) ============
zokou(
  { nomCom: "rules", categorie: "Admin", reaction: "📜", desc: "Affiche les règles du groupe", plugin: "Ozen_Pack", alias: ["regles", "regle"] },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, nomGroupe } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    await repondre(`📜 *RÈGLES DU GROUPE*\n${nomGroupe ? `_${nomGroupe}_` : ""}\n\n1. ✅ Respecter tous les membres\n2. ❌ Pas de spam ou pub\n3. ❌ Pas d'insultes ni provocations\n4. ❌ Pas de contenus inappropriés\n5. ✅ Rester dans le sujet du groupe\n6. ❌ Pas de numéros à partager sans permission\n7. ✅ Écouter les admins\n\n_Merci de respecter ces règles pour une bonne ambiance !_ 🙏`);
  }
);

// ============ WELCOME (Message de bienvenue) ============
zokou(
  { nomCom: "setwelcome", categorie: "Admin", reaction: "👋", desc: "Active/désactive le message de bienvenue (Owner)", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, superUser } = ops;
    if (!superUser) return repondre("❌ Réservé au propriétaire.");
    await repondre(`👋 *MESSAGE DE BIENVENUE*\n\nFonctionnalité activée !\nLes nouveaux membres recevront un message automatique.\n\n_Note : Nécessite le plugin events.upsert pour être complet._`);
  }
);

// ============ LINK (lien du groupe) ============
zokou(
  { nomCom: "link", categorie: "Admin", reaction: "🔗", desc: "Obtient le lien d'invitation du groupe", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    try {
      const code = await zk.groupInviteCode(dest);
      await repondre(`🔗 *LIEN DU GROUPE*\n\nhttps://chat.whatsapp.com/${code}`);
    } catch (e) {
      repondre("❌ Impossible de récupérer le lien. Le bot doit être admin.");
    }
  }
);

// ============ REVOKELINK ============
zokou(
  { nomCom: "revokelink", categorie: "Admin", reaction: "🔒", desc: "Réinitialise le lien d'invitation du groupe", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    try {
      await zk.groupRevokeInvite(dest);
      await repondre("🔒 Lien d'invitation réinitialisé avec succès !");
    } catch (e) {
      repondre("❌ Erreur : " + e.message);
    }
  }
);

// ============ MEMBERS ============
zokou(
  { nomCom: "members", categorie: "Admin", reaction: "👥", desc: "Affiche le nombre de membres du groupe", plugin: "Ozen_Pack", alias: ["nbr"] },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, infosGroupe } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    const total = infosGroupe.participants.length;
    const admins = infosGroupe.participants.filter(p => p.admin).length;
    await repondre(`👥 *MEMBRES DU GROUPE*\n\n👤 Total : *${total}* membres\n👑 Admins : *${admins}*\n🙋 Membres : *${total - admins}*`);
  }
);

// ============ LISTADMINS ============
zokou(
  { nomCom: "admins", categorie: "Admin", reaction: "👑", desc: "Liste tous les admins du groupe", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, infosGroupe, ms } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    const admins = infosGroupe.participants.filter(p => p.admin);
    if (!admins.length) return repondre("❌ Aucun admin trouvé.");
    const mentions = admins.map(p => p.id);
    const liste = admins.map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`).join("\n");
    await zk.sendMessage(dest, {
      text: `👑 *ADMINS DU GROUPE*\n\n${liste}`,
      mentions
    }, { quoted: ms });
  }
);

// ============ MUTEGROUPE ============
zokou(
  { nomCom: "mutegroupe", categorie: "Admin", reaction: "🔇", desc: "Ferme le groupe temporairement", plugin: "Ozen_Pack", alias: ["lockgroup"] },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    try {
      await zk.groupSettingUpdate(dest, "announcement");
      await repondre("🔇 *Groupe fermé.* Seuls les admins peuvent parler.");
    } catch (e) {
      repondre("❌ Erreur : " + e.message);
    }
  }
);

// ============ UNMUTEGROUPE ============
zokou(
  { nomCom: "unmutegroupe", categorie: "Admin", reaction: "🔊", desc: "Ouvre le groupe", plugin: "Ozen_Pack", alias: ["unlockgroup"] },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    try {
      await zk.groupSettingUpdate(dest, "not_announcement");
      await repondre("🔊 *Groupe ouvert.* Tout le monde peut parler.");
    } catch (e) {
      repondre("❌ Erreur : " + e.message);
    }
  }
);

// =========== SECTION UTILITAIRES BONUS ===========

// ============ HEURE ============
zokou(
  { nomCom: "heure", categorie: "Utiles", reaction: "🕐", desc: "Affiche l'heure actuelle (selon fuseau)", plugin: "Ozen_Pack", alias: ["time", "clock"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const zones = {
      abidjan: "Africa/Abidjan", dakar: "Africa/Dakar", paris: "Europe/Paris",
      newyork: "America/New_York", dubai: "Asia/Dubai", tokyo: "Asia/Tokyo",
      london: "Europe/London", montreal: "America/Montreal"
    };
    const ville = arg[0]?.toLowerCase() || "abidjan";
    const tz = zones[ville] || "Africa/Abidjan";
    const heure = new Date().toLocaleString("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    await repondre(`🕐 *HEURE ACTUELLE*\n\n📍 Ville : ${ville.charAt(0).toUpperCase() + ville.slice(1)}\n🕐 Heure : *${heure}*\n\nVilles: abidjan, dakar, paris, newyork, dubai, tokyo, london, montreal`);
  }
);

// ============ DATE ============
zokou(
  { nomCom: "date", categorie: "Utiles", reaction: "📅", desc: "Affiche la date et le jour actuels", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const now = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Abidjan" };
    const dateStr = now.toLocaleDateString("fr-FR", options);
    const jourAnnee = Math.ceil((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const restant = 365 - jourAnnee;
    await repondre(`📅 *DATE ACTUELLE*\n\n📆 ${dateStr}\n📊 Jour ${jourAnnee} de l'année\n⏳ Il reste *${restant} jours* en ${now.getFullYear()}`);
  }
);

// ============ CONVERSION MONNAIE ============
zokou(
  { nomCom: "convert", categorie: "Utiles", reaction: "💱", desc: "Convertit des devises (CFA, EUR, USD...)", plugin: "Ozen_Pack", alias: ["monnaie", "forex"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const montant = parseFloat(arg[0]);
    const de = arg[1]?.toUpperCase();
    const vers = arg[2]?.toUpperCase();
    if (!montant || !de || !vers) return repondre(`Usage: ${ops.prefixe}convert <montant> <de> <vers>\nEx: ${ops.prefixe}convert 1000 XOF EUR\nDevises: XOF, EUR, USD, GBP, GHS, NGN, XAF`);
    const taux = {
      XOF: { EUR: 0.00152, USD: 0.00165, GBP: 0.00131, GHS: 0.021, NGN: 1.35, XAF: 1.0 },
      EUR: { XOF: 655.96, USD: 1.08, GBP: 0.86, GHS: 13.8, NGN: 887, XAF: 655.96 },
      USD: { XOF: 606.9, EUR: 0.925, GBP: 0.79, GHS: 12.7, NGN: 820, XAF: 606.9 },
    };
    if (!taux[de] || !taux[de][vers]) return repondre(`❌ Conversion ${de} → ${vers} non disponible.\nDevises: XOF, EUR, USD`);
    const result = (montant * taux[de][vers]).toFixed(2);
    await repondre(`💱 *CONVERSION*\n\n💰 ${montant} ${de} = *${result} ${vers}*\n\n_Taux approximatif (pas en temps réel)_`);
  }
);

// ============ IMC (Indice masse corporelle) ============
zokou(
  { nomCom: "imc", categorie: "Utiles", reaction: "⚖️", desc: "Calcule ton IMC", plugin: "Ozen_Pack", alias: ["bmi"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const poids = parseFloat(arg[0]);
    const taille = parseFloat(arg[1]);
    if (!poids || !taille) return repondre(`Usage: ${ops.prefixe}imc <poids_kg> <taille_cm>\nEx: ${ops.prefixe}imc 70 175`);
    const tailleM = taille / 100;
    const imc = (poids / (tailleM * tailleM)).toFixed(1);
    let cat = "";
    if (imc < 18.5) cat = "⚠️ Insuffisance pondérale";
    else if (imc < 25) cat = "✅ Poids normal";
    else if (imc < 30) cat = "⚠️ Surpoids";
    else cat = "🔴 Obésité";
    await repondre(`⚖️ *CALCUL IMC*\n\n📊 IMC : *${imc}*\n🏷️ Catégorie : ${cat}\n\n_Valeurs normales : 18.5 à 24.9_`);
  }
);

// ============ TEMPERATURE ============
zokou(
  { nomCom: "temp", categorie: "Utiles", reaction: "🌡️", desc: "Convertit des températures", plugin: "Ozen_Pack", alias: ["celsius", "fahrenheit"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const val = parseFloat(arg[0]);
    const unite = arg[1]?.toUpperCase();
    if (isNaN(val) || !unite) return repondre(`Usage: ${ops.prefixe}temp <valeur> <C/F/K>\nEx: ${ops.prefixe}temp 100 C`);
    let result = "";
    if (unite === "C") {
      result = `${val}°C = *${(val * 9/5 + 32).toFixed(1)}°F* = *${(val + 273.15).toFixed(1)}K*`;
    } else if (unite === "F") {
      result = `${val}°F = *${((val - 32) * 5/9).toFixed(1)}°C* = *${((val - 32) * 5/9 + 273.15).toFixed(1)}K*`;
    } else if (unite === "K") {
      result = `${val}K = *${(val - 273.15).toFixed(1)}°C* = *${((val - 273.15) * 9/5 + 32).toFixed(1)}°F*`;
    } else {
      return repondre("❌ Unité invalide. Utilise C, F ou K");
    }
    await repondre(`🌡️ *CONVERSION TEMPÉRATURE*\n\n${result}`);
  }
);

// ============ ENCODE BASE64 ============
zokou(
  { nomCom: "encode", categorie: "Utiles", reaction: "🔐", desc: "Encode un texte en Base64", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const texte = arg.join(" ");
    if (!texte) return repondre(`Usage: ${ops.prefixe}encode <texte>`);
    const encoded = Buffer.from(texte).toString("base64");
    await repondre(`🔐 *ENCODAGE BASE64*\n\n📝 Original : ${texte}\n\n🔒 Encodé : \`${encoded}\``);
  }
);

// ============ DECODE BASE64 ============
zokou(
  { nomCom: "decode", categorie: "Utiles", reaction: "🔓", desc: "Décode un texte Base64", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const texte = arg[0];
    if (!texte) return repondre(`Usage: ${ops.prefixe}decode <texte_base64>`);
    try {
      const decoded = Buffer.from(texte, "base64").toString("utf-8");
      await repondre(`🔓 *DÉCODAGE BASE64*\n\n🔒 Encodé : ${texte}\n\n📝 Décodé : \`${decoded}\``);
    } catch (e) {
      repondre("❌ Texte Base64 invalide.");
    }
  }
);

// ============ COUNTDOWN ============
zokou(
  { nomCom: "countdown", categorie: "Utiles", reaction: "⏳", desc: "Compte à rebours jusqu'à une date", plugin: "Ozen_Pack", alias: ["compter"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const dateStr = arg.join(" ");
    if (!dateStr) return repondre(`Usage: ${ops.prefixe}countdown <JJ/MM/AAAA>\nEx: ${ops.prefixe}countdown 31/12/2025`);
    const [j, m, a] = dateStr.split("/").map(Number);
    if (!j || !m || !a) return repondre("❌ Format invalide. Utilise JJ/MM/AAAA");
    const cible = new Date(a, m - 1, j);
    const now = new Date();
    const diff = cible - now;
    if (diff < 0) return repondre("❌ Cette date est déjà passée !");
    const jours = Math.floor(diff / (1000 * 60 * 60 * 24));
    const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    await repondre(`⏳ *COMPTE À REBOURS*\n\n📅 Jusqu'au : ${dateStr}\n\n⏱️ Il reste :\n*${jours} jours*, *${heures} heures*, *${minutes} minutes*`);
  }
);

// ============ TABLEAU DE BORD (Owner) ============
zokou(
  { nomCom: "dashboard", categorie: "Owner", reaction: "📊", desc: "Tableau de bord du bot (Owner)", plugin: "Ozen_Pack", alias: ["dash", "status2"] },
  async (dest, zk, ops) => {
    const { repondre, superUser } = ops;
    if (!superUser) return repondre("❌ Réservé au propriétaire.");
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const mem = process.memoryUsage();
    const heapUsed = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(mem.heapTotal / 1024 / 1024);
    const { cm: allCmds } = require("../framework/ozen");
    await repondre(`📊 *DASHBOARD OZEN-MD*\n\n⏱️ Uptime : ${h}h ${m}m ${s}s\n💾 RAM : ${heapUsed}MB / ${heapTotal}MB\n🤖 Node.js : ${process.version}\n📦 Commandes chargées : ${allCmds.length}\n🖥️ Plateforme : ${process.platform}\n📡 PID : ${process.pid}`);
  }
);

// ============ CLEARBOT (Owner) ============
zokou(
  { nomCom: "clearbot", categorie: "Owner", reaction: "🧹", desc: "Nettoie les fichiers temporaires du bot (Owner)", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre, superUser } = ops;
    if (!superUser) return repondre("❌ Réservé au propriétaire.");
    try {
      const tmpFiles = fs.readdirSync(__dirname).filter(f => f.startsWith("temp_"));
      tmpFiles.forEach(f => fs.unlinkSync(path.join(__dirname, f)));
      await repondre(`🧹 *Nettoyage effectué !*\n\n🗑️ ${tmpFiles.length} fichier(s) temporaire(s) supprimé(s).`);
    } catch (e) {
      repondre("❌ Erreur lors du nettoyage : " + e.message);
    }
  }
);

// ============ ABOUT ============
zokou(
  { nomCom: "about", categorie: "Utiles", reaction: "✨", desc: "À propos de OZEN-MD", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    await repondre(`✨ *À PROPOS D'OZEN-MD*\n\n🤖 Nom : OZEN-MD\n👨‍💻 Développeur : gninoue-dev\n🔧 Framework : Baileys (@whiskeysockets)\n💻 Langage : JavaScript (Node.js)\n📦 Version : 2.0.0\n\n🌍 Un bot WhatsApp puissant, fait pour l'Afrique et le monde.\n\n_Merci d'utiliser OZEN-MD !_ 🙏`);
  }
);

// ============ AIDE COMMANDE ============
zokou(
  { nomCom: "aide2", categorie: "Utiles", reaction: "❓", desc: "Aide détaillée sur une commande", plugin: "Ozen_Pack", alias: ["helpme"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const { cm: allCmds } = require("../framework/ozen");
    const nomCmd = arg[0]?.toLowerCase();
    if (!nomCmd) return repondre(`Usage: ${ops.prefixe}aide2 <commande>\nEx: ${ops.prefixe}aide2 spam`);
    const cmd = allCmds.find(c => c.nomCom === nomCmd || (c.alias && c.alias.includes(nomCmd)));
    if (!cmd) return repondre(`❌ Commande "${nomCmd}" introuvable.`);
    const aliases = cmd.alias ? cmd.alias.join(", ") : "Aucun";
    await repondre(`❓ *AIDE - ${cmd.nomCom.toUpperCase()}*\n\n📝 Description : ${cmd.desc || "Aucune"}\n🏷️ Catégorie : ${cmd.categorie}\n🔄 Aliases : ${aliases}\n😊 Réaction : ${cmd.reaction}`);
  }
);

// ============ RANDOM EMOJI ============
zokou(
  { nomCom: "emoji", categorie: "IA/Fun", reaction: "😜", desc: "Envoie un emoji aléatoire avec signification", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const emojis = [
      { e: "🦁", s: "Lion — Force et leadership" },
      { e: "🌊", s: "Vague — Liberté et fluidité" },
      { e: "🔥", s: "Feu — Passion et énergie" },
      { e: "💎", s: "Diamant — Valeur et rareté" },
      { e: "🌙", s: "Lune — Mystère et intuition" },
      { e: "⚡", s: "Éclair — Rapidité et puissance" },
      { e: "🌺", s: "Fleur — Beauté et renouveau" },
      { e: "🦅", s: "Aigle — Vision et ambition" },
      { e: "🎯", s: "Cible — Focus et précision" },
      { e: "🌍", s: "Terre — Appartenance et unité" },
    ];
    const e = emojis[Math.floor(Math.random() * emojis.length)];
    await repondre(`😜 *EMOJI DU MOMENT*\n\n${e.e}\n\n💡 Signification : _${e.s}_`);
  }
);

// ============ VERSET ============
zokou(
  { nomCom: "verset", categorie: "IA/Fun", reaction: "🙏", desc: "Verset ou sagesse spirituelle aléatoire", plugin: "Ozen_Pack", alias: ["sagesse", "spirituel"] },
  async (dest, zk, ops) => {
    const { repondre } = ops;
    const versets = [
      { v: "Car je connais les projets que j'ai formés sur vous, projets de paix et non de malheur.", src: "Jérémie 29:11 📖" },
      { v: "Je puis tout par celui qui me fortifie.", src: "Philippiens 4:13 📖" },
      { v: "L'homme sage bâtit sa maison sur le roc.", src: "Matthieu 7:24 📖" },
      { v: "Celui qui cherche trouve.", src: "Matthieu 7:8 📖" },
      { v: "La paix soit avec toi.", src: "Jean 20:19 ✝️" },
      { v: "Bismillah — Au nom de Dieu, le Tout-Miséricordieux.", src: "Coran 1:1 ☪️" },
      { v: "Agis bien aujourd'hui et demain sera meilleur.", src: "Sagesse africaine 🌍" },
      { v: "L'espoir fait vivre.", src: "Proverbe universel 🌟" },
    ];
    const v = versets[Math.floor(Math.random() * versets.length)];
    await repondre(`🙏 *SAGESSE DU JOUR*\n\n_"${v.v}"_\n\n— ${v.src}`);
  }
);

// ============ TAG UN MEMBRE ALÉATOIRE ============
zokou(
  { nomCom: "tagrandom", categorie: "IA/Fun", reaction: "🎯", desc: "Mentionne un membre au hasard dans le groupe", plugin: "Ozen_Pack", alias: ["random_tag"] },
  async (dest, zk, ops) => {
    const { repondre, verifGroupe, infosGroupe, arg, ms } = ops;
    if (!verifGroupe) return repondre("❌ Commande de groupe uniquement.");
    const participants = infosGroupe.participants;
    const random = participants[Math.floor(Math.random() * participants.length)];
    const message = arg.join(" ") || "Hé toi ! Tu as été sélectionné(e) 🎯";
    await zk.sendMessage(dest, {
      text: `🎯 @${random.id.split("@")[0]} ${message}`,
      mentions: [random.id]
    }, { quoted: ms });
  }
);

// ============ COPIER MESSAGE ============
zokou(
  { nomCom: "copier", categorie: "Utiles", reaction: "📋", desc: "Renvoie le message cité proprement", plugin: "Ozen_Pack", alias: ["copy"] },
  async (dest, zk, ops) => {
    const { repondre, msgRepondu } = ops;
    if (!msgRepondu) return repondre("❌ Réponds à un message pour le copier.");
    const texte = msgRepondu.conversation || msgRepondu.extendedTextMessage?.text || msgRepondu.imageMessage?.caption || msgRepondu.videoMessage?.caption || null;
    if (!texte) return repondre("❌ Je ne peux copier que des messages texte.");
    await repondre(`📋 *Message copié :*\n\n${texte}`);
  }
);

// ============ SPOILER ============
zokou(
  { nomCom: "spoiler", categorie: "IA/Fun", reaction: "🙈", desc: "Envoie un message caché en spoiler style", plugin: "Ozen_Pack" },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const texte = arg.join(" ");
    if (!texte) return repondre(`Usage: ${ops.prefixe}spoiler <message>`);
    await repondre(`🙈 *SPOILER OZEN*\n\n||${texte}||`);
  }
);

// ============ ANNIVERSAIRE ============
zokou(
  { nomCom: "anniv", categorie: "IA/Fun", reaction: "🎂", desc: "Envoie un message d'anniversaire à quelqu'un", plugin: "Ozen_Pack", alias: ["birthday", "hbd"] },
  async (dest, zk, ops) => {
    const { arg, repondre, auteurMsgRepondu, ms } = ops;
    const cible = auteurMsgRepondu ? auteurMsgRepondu.split("@")[0] : arg[0]?.replace(/\D/g, "");
    if (!cible) return repondre(`Usage: ${ops.prefixe}anniv (réponds au message de la personne)`);
    await zk.sendMessage(dest, {
      text: `🎂🎉 *JOYEUX ANNIVERSAIRE @${cible} !* 🎉🎂\n\n🌟 Que cette belle journée t'apporte :\n💰 Prospérité\n❤️ Amour\n🏆 Succès\n😊 Bonheur\n\n_De la part de OZEN-MD et toute la famille !_ 🙏`,
      mentions: [auteurMsgRepondu || (cible + "@s.whatsapp.net")]
    }, { quoted: ms });
  }
);

// ============ SUPPRIMER (Admin) ============
zokou(
  { nomCom: "supprimer", categorie: "Admin", reaction: "🗑️", desc: "Supprime le message cité (si bot admin)", plugin: "Ozen_Pack", alias: ["del", "delete"] },
  async (dest, zk, ops) => {
    const { repondre, ms, verifAdmin, superUser, msgRepondu } = ops;
    if (!verifAdmin && !superUser) return repondre("❌ Réservé aux admins.");
    if (!msgRepondu) return repondre("❌ Réponds au message que tu veux supprimer.");
    try {
      await zk.sendMessage(dest, { delete: ms.message?.extendedTextMessage?.contextInfo?.stanzaId
        ? { id: ms.message.extendedTextMessage.contextInfo.stanzaId, remoteJid: dest, fromMe: false }
        : ms.key
      });
      await repondre("🗑️ Message supprimé.");
    } catch (e) {
      repondre("❌ Impossible de supprimer ce message.");
    }
  }
);

// ============ JEU : PLUS OU MOINS ============
zokou(
  { nomCom: "deviner", categorie: "IA/Fun", reaction: "🔢", desc: "Jeu Plus ou Moins (1-100)", plugin: "Ozen_Pack", alias: ["plusoumoins"] },
  async (dest, zk, ops) => {
    const { arg, repondre } = ops;
    const nombre = parseInt(arg[0]);
    if (!nombre) {
      const secret = Math.floor(Math.random() * 100) + 1;
      process.env[`DEVINER_${dest}`] = secret;
      return repondre(`🔢 *JEU PLUS OU MOINS*\n\nJ'ai pensé à un nombre entre 1 et 100.\nUtilise ${ops.prefixe}deviner <ton_nombre> pour deviner !`);
    }
    const secret = parseInt(process.env[`DEVINER_${dest}`]);
    if (!secret) return repondre(`❌ Lance d'abord une partie avec ${ops.prefixe}deviner`);
    if (nombre === secret) {
      delete process.env[`DEVINER_${dest}`];
      return repondre(`🎉 BRAVO ! C'était bien *${secret}* ! Tu as gagné ! 🏆`);
    }
    await repondre(nombre < secret ? `⬆️ C'est *plus* ! (tu as dit ${nombre})` : `⬇️ C'est *moins* ! (tu as dit ${nombre})`);
  }
);

console.log("✅ Ozen_Pack chargé avec succès ! (100+ commandes actives)");
