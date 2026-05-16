# 📁 resources/

Déposes ici tes vidéos et GIFs pour les thèmes du bot.

## Organisation suggérée

```
resources/
  aot/
    menu.mp4        ← vidéo principale du thème AOT
    menu.gif        ← fallback GIF si la vidéo échoue
  dbz/
    menu.mp4
    menu.gif
  naruto/
    menu.mp4
    menu.gif
  minimal/
    menu.gif
```

## Utilisation dans un thème

Dans `themes/aot.js`, remplace les URLs par le chemin local :

```js
media: {
    type: "video",
    url:  "./resources/aot/menu.mp4",
    gifPlayback: true,
    fallbackUrl:  "./resources/aot/menu.gif",
    fallbackType: "image",
},
```

## Formats supportés

- Vidéo : `.mp4` (recommandé), `.mkv`
- Image  : `.gif`, `.jpg`, `.png`, `.webp`

## Taille recommandée

- Vidéo : moins de 5 Mo pour un envoi rapide
- GIF   : moins de 2 Mo
