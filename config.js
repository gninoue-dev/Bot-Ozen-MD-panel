module.exports = {
    prefixe: "#",
    nomBot: "OZEN-MD",
    // ✅ OWNER principal (numéro sans + ni espaces)
    OWNER: "2250103508128",
    // ✅ Liste de tous les numéros Owner (modifiable via #addowner / #removeowner)
    proprietaire: [
        "2250103508128",
        // "2250XXXXXXXXX",  // ← Ajoutez d'autres numéros ici si besoin
    ],
    session: "session_id_ici",
    MODE: "private",  // "private" = seuls les owners utilisent le bot
                      // "public"  = tout le monde peut utiliser le bot
    // Commandes accessibles à TOUS même en mode privé
    commandesPubliques: ["gamecouple", "gc", "ping"],
};
