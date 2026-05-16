// ══════════════════════════════════════════════
//  THÈME : Attaque des Titans (AOT)
//  進撃の巨人 — Shingeki no Kyojin
// ══════════════════════════════════════════════

module.exports = {

    // ── Identité ───────────────────────────────
    nom:         "aot",
    nomComplet:  "⚔️ Attaque des Titans",
    description: "Thème sombre inspiré de Shingeki no Kyojin",

    // ── Média d'intro (vidéo ou image envoyée avec le menu) ───────────────
    // → Dépose ton fichier dans resources/aot/ puis ajuste le nom ici
    media: {
        type: "video",        // "video" | "image" | "none"
        url:  "./resources/aot/menu.mp4",
        gifPlayback: true,
        fallbackUrl:  "./resources/aot/menu.gif",
        fallbackType: "image",
    },

    // ── Icônes par catégorie ───────────────────
    icones: {
        "General":  "📜",
        "Utiles":   "🔧",
        "Fun":      "🎮",
        "IA/Fun":   "🤖",
        "Media":    "🎬",
        "Musique":  "🎵",
        "Admin":    "🛡️",
        "Owner":    "👑",
        "_defaut":  "⚔️",
    },

    // ── Séparateurs / bordures ─────────────────
    bordures: {
        h:  "═══════════════════════",   // horizontal épais
        hm: "───────────────────────",   // horizontal fin
        tl: "╔", tr: "╗",               // coins haut
        ml: "╠", mr: "╣",               // milieu
        bl: "╚", br: "╝",               // coins bas
        v:  "║",                          // vertical
        sl: "┌", sr: "┐",               // section haut
        sm: "├", smr: "┤",              // section milieu
        el: "└", er: "┘",               // section bas
        sv: "│",                          // section vertical
    },

    // ── Textes du menu ─────────────────────────
    textes: {
        titreLigne1:  (nomBot) => `⚔️  *${nomBot} — BOT ULTIME*  ⚔️`,
        titreLigne2:  () => `_進撃の巨人 — Shingeki no Kyojin_`,
        soldat:       (numero) => `👤 Soldat : *+${numero}*`,
        arsenal:      (n) => `📦 Arsenal : *${n} commandes*`,
        prefixe:      (p) => `🗝️  Préfixe : *${p}*`,
        citation:     () => `_"Si tu abandonnes, tu n'es plus_\n║  _qu'un titan sans âme..."_  — Eren`,
        footer1:      (nomBot) => `⚔️  *${nomBot}* — _Propulsé par_`,
        footer2:      () => `_gninoue-dev • Baileys Framework_`,
        footer3:      () => `_「自由の翼」— Les Ailes de la Liberté_`,
        cmdLigne:     (prefixe, nomCom, desc) => `│ ◈ *${prefixe}${nomCom}*${desc ? `  ↳ _${desc}_` : ""}`,
        catTitre:     (icone, cat, n) => `│ ${icone}  *${cat.toUpperCase()}*  [${n} cmd${n > 1 ? "s" : ""}]`,
    },
};
