let cm = []; 

// On garde le nom 'zokou' en interne pour que les plugins fonctionnent sans modifs
function zokou(obj, fonctions) {
    let infoCom = obj;
    if (!infoCom.categorie) infoCom.categorie = "Général";
    if (!infoCom.reaction) infoCom.reaction = "🌀";
    infoCom.fonction = fonctions;
    cm.push(infoCom);
    return infoCom;
}

module.exports = { zokou, cm }; // On exporte 'zokou'