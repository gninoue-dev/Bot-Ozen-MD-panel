# OZEN-MD — Guide de déploiement Katabump

## 🚀 Déploiement sur Katabump

### Étape 1 — Obtenir la SESSION_ID

Exécutez le bot **une seule fois en local** pour vous authentifier :

```bash
npm install
node index.js
# Choisissez QR Code ou Pairing Code
```

Une fois connecté, encodez le fichier `auth/creds.json` en Base64 :

```bash
# Linux / Mac
base64 -w 0 auth/creds.json

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("auth\creds.json"))
```

Copiez la chaîne Base64 obtenue.

---

### Étape 2 — Configurer Katabump

Dans le panneau **Environment Variables** de Katabump, ajoutez :

| Variable     | Valeur                            |
|-------------|-----------------------------------|
| `SESSION_ID` | La chaîne Base64 de creds.json   |
| `PREFIX`     | `#` (ou votre préfixe préféré)   |

---

### Étape 3 — Déployer

Poussez le code sur Katabump (sans le dossier `auth/` ni `node_modules/`).

Katabump exécutera automatiquement :
```
npm install && node index.js
```

---

## ⚙️ Variables d'environnement

| Variable       | Requis | Description                                              |
|---------------|--------|----------------------------------------------------------|
| `SESSION_ID`  | ✅ Oui | Session WhatsApp en Base64                               |
| `PHONE_NUMBER`| ⚠️ Alt  | Numéro pour Pairing Code (si pas de SESSION_ID)         |
| `PREFIX`      | ❌ Non  | Préfixe commandes (défaut : `#` depuis config.js)       |

---

## 🔧 Développement local

```bash
npm install
node index.js   # mode interactif (QR ou Pairing Code)
```

---

## 📁 Structure

```
OZEN-MD/
├── index.js          ← Point d'entrée (modifié pour Katabump)
├── config.js         ← Configuration (préfixe, owner, etc.)
├── package.json      ← Scripts npm (start: node index.js)
├── Procfile          ← Instruction de démarrage Katabump
├── .env.example      ← Modèle de variables d'environnement
├── framework/
│   └── ozen.js       ← Registre des commandes
└── plugins/
    └── Ozen_Pack.js  ← Plugins / commandes du bot
```
