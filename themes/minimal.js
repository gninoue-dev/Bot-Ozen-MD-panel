// ══════════════════════════════════════════════
//  THÈME : Minimal
//  Style épuré, professionnel et lisible
// ══════════════════════════════════════════════

module.exports = {

    // ── Identité ───────────────────────────────
    nom:         "minimal",
    nomComplet:  "✦ Minimal",
    description: "Style épuré, propre et professionnel",

    // ── Média d'intro ──────────────────────────
    media: {
        type: "none",   // Pas de vidéo/image, juste le texte
    },

    // ── Icônes par catégorie ───────────────────
    icones: {
        "General":  "◉",
        "Utiles":   "◈",
        "Fun":      "◇",
        "IA/Fun":   "◆",
        "Media":    "◉",
        "Musique":  "♪",
        "Admin":    "◈",
        "Owner":    "◆",
        "_defaut":  "◇",
    },

    // ── Séparateurs / bordures ─────────────────
    bordures: {
        h:  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
        hm: "· · · · · · · · · · · · · · · · · · · ·",
        tl: "▛", tr: "▜",
        ml: "▌", mr: "▐",
        bl: "▙", br: "▟",
        v:  "▌",
        sl: "▸", sr: "",
        sm: "▸", smr: "",
        el: "▸", er: "",
        sv: " ",
    },

    // ── Textes du menu ─────────────────────────
    textes: {
        titreLigne1:  (nomBot) => `✦  *${nomBot}*  ✦`,
        titreLigne2:  () => `_Le bot WhatsApp nouvelle génération_`,
        soldat:       (numero) => `▸ Utilisateur : *+${numero}*`,
        arsenal:      (n) => `▸ Commandes : *${n} disponibles*`,
        prefixe:      (p) => `▸ Préfixe : *${p}*`,
        citation:     () => `_"Simple. Efficace. Puissant."_`,
        footer1:      (nomBot) => `✦  *${nomBot}*`,
        footer2:      () => `_gninoue-dev • Baileys_`,
        footer3:      () => `_v1.0.0 — Made with ♥_`,
        cmdLigne:     (prefixe, nomCom, desc) => `  · *${prefixe}${nomCom}*${desc ? ` — _${desc}_` : ""}`,
        catTitre:     (icone, cat, n) => `${icone} *${cat}*  _(${n})_`,
    },
};
