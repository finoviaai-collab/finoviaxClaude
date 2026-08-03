# Appel du Père Noël 🎅

Petite application web (sans dépendance, sans backend) qui simule un appel téléphonique du Père Noël pour un jeune enfant. Pensée à l'origine pour Léo (3 ans), mais le prénom est personnalisable.

## Fonctionnement

1. Le parent saisit le prénom de l'enfant et lance l'appel.
2. Un écran d'appel entrant façon smartphone s'affiche ; on décroche.
3. Le Père Noël parle à voix haute (synthèse vocale du navigateur, en français) : il salue l'enfant, lui demande s'il a été sage, ce qu'il a commandé pour Noël, s'il a autre chose à ajouter, puis dit au revoir.
4. À chaque question, l'enfant (ou le parent en son nom) choisit une réponse parmi des boutons adaptés, ou tape une réponse libre.
5. À la fin, un résumé de l'appel s'affiche (ce que l'enfant a "commandé", etc.).

Aucune donnée n'est envoyée à un serveur : tout se passe dans le navigateur.

## Utilisation

Ouvrir simplement `index.html` dans un navigateur (idéalement Chrome, pour un meilleur support de la synthèse vocale française), ou servir le dossier :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Pour une expérience optimale sur mobile : ouvrir la page sur le téléphone du parent, activer le haut-parleur, et tenir l'écran face à l'enfant pendant l'appel.

## Notes techniques

- 100% HTML/CSS/JS vanilla, sans framework ni build.
- Utilise l'API `SpeechSynthesis` du navigateur pour faire "parler" le Père Noël. Si la voix n'est pas audible, le bouton "🔊 Réécouter" permet de relancer la phrase.
- Le script de conversation (questions/réactions) se trouve dans `app.js` (constante `STEPS`) et peut être facilement adapté ou enrichi.
