// ══════════════════════════════════════════════
//  THÈME : Dragon Ball Z
//  ドラゴンボール — Doragon Bōru
// ══════════════════════════════════════════════

module.exports = {

    // ── Identité ───────────────────────────────
    nom:         "dbz",
    nomComplet:  "🐉 Dragon Ball Z",
    description: "Thème épique inspiré de l'univers de Goku",

    // ── Média d'intro ──────────────────────────
    // → Dépose ton fichier dans resources/dbz/ puis ajuste le nom ici
    media: {
        type: "image",
        url:  "./resources/dbz/menu.gif",
        fallbackUrl:  "./resources/dbz/menu.gif",
        fallbackType: "image",
    },

    // ── Icônes par catégorie ───────────────────
    icones: {
        "General":  "📜",
        "Utiles":   "⚡",
        "Fun":      "🎮",
        "IA/Fun":   "🤖",
        "Media":    "📺",
        "Musique":  "🎵",
        "Admin":    "🔱",
        "Owner":    "👑",
        "_defaut":  "🐉",
    },

    // ── Séparateurs / bordures ─────────────────
    bordures: {
        h:  "★━━━━━━━━━━━━━━━━━━━★",
        hm: "─────────────────────",
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
        titreLigne1:  (nomBot) => `🐉  *${nomBot} — SUPER SAIYAN*  🐉`,
        titreLigne2:  () => `_ドラゴンボール — Dragon Ball Z_`,
        soldat:       (numero) => `🥋 Guerrier : *+${numero}*`,
        arsenal:      (n) => `⚡ Pouvoirs : *${n} techniques*`,
        prefixe:      (p) => `🔮 Préfixe : *${p}*`,
        citation:     () => `_"Je surpasserai toujours mes limites !_\n║  _C'est la voie du guerrier."_  — Goku`,
        footer1:      (nomBot) => `🐉  *${nomBot}* — _Propulsé par_`,
        footer2:      () => `_gninoue-dev • Baileys Framework_`,
        footer3:      () => `_「かめはめ波」— Ka-me-ha-me-HA !_`,
        cmdLigne:     (prefixe, nomCom, desc) => `│ ➤ *${prefixe}${nomCom}*${desc ? `  ~ _${desc}_` : ""}`,
        catTitre:     (icone, cat, n) => `│ ${icone}  *${cat.toUpperCase()}*  (${n})`,
    },
};
