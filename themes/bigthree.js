// ══════════════════════════════════════════════
//  THÈME : Big Three Anime
//  Dragon Ball Z ✦ Bleach ✦ One Piece
// ══════════════════════════════════════════════

module.exports = {

    // ── Identité ───────────────────────────────
    nom:         "bigthree",
    nomComplet:  "🔥 Big Three Anime",
    description: "Dragon Ball Z • Bleach • One Piece",

    // ── Média d'intro ──────────────────────────
    // → Dépose ton fichier dans resources/bigthree/ puis ajuste le nom ici
    media: {
        type: "video",        // "video" | "image" | "none"
        url:  "./resources/bigthree/menu.mp4",
        gifPlayback: true,
        fallbackUrl:  "./resources/bigthree/menu.gif",
        fallbackType: "image",
    },

    // ── Icônes par catégorie ───────────────────
    icones: {
        "General":  "📜",
        "Utiles":   "⚡",
        "Fun":      "☠️",
        "IA/Fun":   "🤖",
        "Media":    "🎬",
        "Musique":  "🎵",
        "Admin":    "⚔️",
        "Owner":    "👑",
        "_defaut":  "🔥",
    },

    // ── Séparateurs / bordures ─────────────────
    bordures: {
        h:  "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰",
        hm: "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
        tl: "╔", tr: "╗",
        ml: "╠", mr: "╣",
        bl: "╚", br: "╝",
        v:  "║",
        sl: "┌", sr: "┐",
        sm: "├", smr: "┤",
        el: "└", er: "┘",
        sv: "│",
    },

    // ── Textes du menu ─────────────────────────
    textes: {
        titreLigne1: (nomBot) => `🔥 *${nomBot} — BIG THREE EDITION* 🔥`,
        titreLigne2: () =>
            `_⚡ Dragon Ball Z  •  ⚔️ Bleach  •  ☠️ One Piece_`,
        soldat:  (numero) => `☠️ Nakama : *+${numero}*`,
        arsenal: (n)      => `⚡ Pouvoirs : *${n} techniques*`,
        prefixe: (p)      => `🔱 Préfixe : *${p}*`,
        citation: () =>
            `_"La force seule ne suffit pas..._\n║  _il faut des nakamas."_ — Luffy`,
        footer1: (nomBot) => `🔥 *${nomBot}* — _Propulsé par_`,
        footer2: ()       => `_gninoue-dev • Baileys Framework_`,
        footer3: ()       =>
            `_⚡ KAMEHAMEHA  •  ⚔️ BANKAI  •  ☠️ GOMU GOMU_`,
        cmdLigne: (prefixe, nomCom, desc) =>
            `│ ◈ *${prefixe}${nomCom}*${desc ? `  ↳ _${desc}_` : ""}`,
        catTitre: (icone, cat, n) =>
            `│ ${icone}  *${cat.toUpperCase()}*  [${n} cmd${n > 1 ? "s" : ""}]`,
    },
};
