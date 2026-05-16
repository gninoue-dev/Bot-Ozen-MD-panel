// ══════════════════════════════════════════════
//  THÈME : Naruto
//  ナルト — Uzumaki Naruto
// ══════════════════════════════════════════════

module.exports = {

    // ── Identité ───────────────────────────────
    nom:         "naruto",
    nomComplet:  "🍃 Naruto",
    description: "Thème ninja inspiré du Village Caché de la Feuille",

    // ── Média d'intro ──────────────────────────
    // → Dépose ton fichier dans resources/naruto/ puis ajuste le nom ici
     media: {
        type: "video",        // "video" | "image" | "none"
        url:  "./resources/naruto/menu.mp4",
        gifPlayback: true,
        fallbackUrl:  "./resources/naruto/menu.gif",
        fallbackType: "image",
    },
    // ── Icônes par catégorie ───────────────────
    icones: {
        "General":  "📜",
        "Utiles":   "🌀",
        "Fun":      "🎮",
        "IA/Fun":   "🤖",
        "Media":    "📺",
        "Musique":  "🎵",
        "Admin":    "🔰",
        "Owner":    "👑",
        "_defaut":  "🍃",
    },

    // ── Séparateurs / bordures ─────────────────
    bordures: {
        h:  "〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓",
        hm: "- - - - - - - - - - - - - - - - - - - -",
        tl: "┏", tr: "┓",
        ml: "┣", mr: "┫",
        bl: "┗", br: "┛",
        v:  "┃",
        sl: "╭", sr: "╮",
        sm: "├", smr: "┤",
        el: "╰", er: "╯",
        sv: "│",
    },

    // ── Textes du menu ─────────────────────────
    textes: {
        titreLigne1:  (nomBot) => `🍃  *${nomBot} — HOKAGE BOT*  🍃`,
        titreLigne2:  () => `_ナルト — Village Caché de la Feuille_`,
        soldat:       (numero) => `🥷 Ninja : *+${numero}*`,
        arsenal:      (n) => `📜 Jutsu : *${n} techniques*`,
        prefixe:      (p) => `🌀 Sceau : *${p}*`,
        citation:     () => `_"Je ne recule jamais, je ne mens jamais_\n┃  _et je n'abandonne jamais !"_ — Naruto`,
        footer1:      (nomBot) => `🍃  *${nomBot}* — _Propulsé par_`,
        footer2:      () => `_gninoue-dev • Baileys Framework_`,
        footer3:      () => `_「信じること」— Croire en toi, c'est tout_`,
        cmdLigne:     (prefixe, nomCom, desc) => `│ ✦ *${prefixe}${nomCom}*${desc ? `  » _${desc}_` : ""}`,
        catTitre:     (icone, cat, n) => `│ ${icone}  *${cat.toUpperCase()}*  [${n}]`,
    },
};
