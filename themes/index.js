// ══════════════════════════════════════════════
//  OZEN-MD — Gestionnaire de Thèmes
//  Ajouter un thème : créer un fichier themes/montheme.js
//  Changer de thème : commande #theme <nom>
// ══════════════════════════════════════════════

const fs   = require("fs");
const path = require("path");

const PREF_FILE    = path.join(__dirname, "actif.json");
const RACINE       = path.join(__dirname, ".."); // dossier Bot-Ozen-MD-panel-main

// ── Résoudre un chemin média (local ou URL) ────────────────────────────────
// Si l'URL commence par "./" ou "/" → chemin local absolu
// Sinon → URL distante, on laisse tel quel
function resoudreMedia(theme) {
    if (!theme.media || theme.media.type === "none") return theme;
    const m = { ...theme.media };
    if (m.url && (m.url.startsWith("./") || m.url.startsWith("/"))) {
        m.url = path.join(RACINE, m.url);
    }
    if (m.fallbackUrl && (m.fallbackUrl.startsWith("./") || m.fallbackUrl.startsWith("/"))) {
        m.fallbackUrl = path.join(RACINE, m.fallbackUrl);
    }
    return { ...theme, media: m };
}

// ── Lire le nom du thème actif (défaut : aot) ──────────────────────────────
function getThemeActif() {
    try {
        if (fs.existsSync(PREF_FILE)) {
            return JSON.parse(fs.readFileSync(PREF_FILE, "utf-8")).theme || "aot";
        }
    } catch (_) {}
    return "aot";
}

// ── Sauvegarder le thème actif ─────────────────────────────────────────────
function setThemeActif(nom) {
    fs.writeFileSync(PREF_FILE, JSON.stringify({ theme: nom }, null, 2));
}

// ── Charger un thème par son nom ───────────────────────────────────────────
function chargerTheme(nom) {
    const fichier = path.join(__dirname, `${nom}.js`);
    if (!fs.existsSync(fichier)) return null;
    delete require.cache[require.resolve(fichier)];
    return resoudreMedia(require(fichier));
}

// ── Lister tous les thèmes disponibles ────────────────────────────────────
function listerThemes() {
    return fs.readdirSync(__dirname)
        .filter(f => f.endsWith(".js") && f !== "index.js")
        .map(f => f.replace(".js", ""));
}

// ── Obtenir le thème actif chargé ─────────────────────────────────────────
function getTheme() {
    const nom = getThemeActif();
    const theme = chargerTheme(nom);
    if (!theme) {
        const fallback = chargerTheme("aot");
        return fallback || resoudreMedia(require("./aot"));
    }
    return theme;
}

module.exports = { getTheme, getThemeActif, setThemeActif, chargerTheme, listerThemes };
