# Référence — Audit SEO d'un article existant

Fichier à consulter quand l'utilisateur fournit un article à analyser (Workflow 2).

## Principe

Un audit n'est **jamais** une checklist générique. Chaque point doit pointer une phrase, un paragraphe ou un élément **précis** de l'article analysé. Citer le texte original pour contextualiser chaque remarque.

Si l'utilisateur fournit une URL : lire la page avec `web_fetch`. Si c'est un fichier : l'ouvrir. Si c'est collé dans le chat : travailler à partir de ce texte.

## Format du rapport d'audit

Toujours livrer dans cet ordre :

1. **Résumé exécutif** (3-4 phrases)
2. **Scores** (global + 4 sous-scores)
3. **Forces** (ce qui fonctionne)
4. **Faiblesses critiques** (priorité 1)
5. **Optimisations secondaires** (priorité 2)
6. **Réécritures proposées** (title, meta, intro a minima)
7. **Plan d'action synthétique**

## Système de scoring

Scores sur 100, répartis en 4 axes de 25 points chacun :

### Axe 1 — Sémantique & mots-clés (25 pts)
- Mot-clé principal identifiable et présent dans title / H1 / intro ? (8 pts)
- Densité du mot-clé et synonymes ? (5 pts)
- Intention de recherche respectée ? (5 pts)
- Champ lexical riche et pertinent ? (4 pts)
- Pas de suroptimisation / bourrage ? (3 pts)

### Axe 2 — Structure & balisage (25 pts)
- Title présent, bonne longueur (35-65 car), mot-clé en début ? (5 pts)
- Meta description présente, incitative, ≤135 car ? (4 pts)
- H1 unique, contient le mot-clé ? (5 pts)
- Hiérarchie Hn logique, pas de saut de niveau ? (4 pts)
- URL propre (tirets, courte, mot-clé) ? (3 pts)
- Images avec alt optimisés ? (4 pts)

### Axe 3 — Contenu & EEAT (25 pts)
- Longueur adaptée à la requête (vs concurrence) ? (5 pts)
- Exemples concrets, données chiffrées, sources ? (6 pts)
- Signaux EEAT présents (auteur, date, expertise) ? (5 pts)
- Contenu original (pas copié ou traduit mécaniquement) ? (4 pts)
- Présence d'une FAQ ou questions/réponses ? (3 pts)
- Diversité des formats (listes, tableaux, citations) ? (2 pts)

### Axe 4 — UX & lisibilité (25 pts)
- Paragraphes courts, phrases aérées ? (5 pts)
- Intro accrocheuse avec promesse et mot-clé en haut ? (5 pts)
- Transitions entre sections fluides ? (4 pts)
- Conclusion apporte une valeur, pas un résumé creux ? (4 pts)
- Maillage interne pertinent ? (4 pts)
- Appel à l'action clair ? (3 pts)

## Grille des 25 points à vérifier (checklist)

### Balises & métadonnées
- [ ] Balise `<title>` présente, 35-65 caractères, mot-clé en début
- [ ] Meta description ≤ 135 caractères, incitative, avec mot-clé
- [ ] URL courte, lisible, avec tirets et mot-clé principal
- [ ] H1 unique sur la page, contient le mot-clé (variation du title)

### Structure du contenu
- [ ] Hiérarchie Hn logique (H1 → H2 → H3 sans saut)
- [ ] Au moins 2 H2 minimum
- [ ] H2 contiennent des variations sémantiques
- [ ] Plan du contenu cohérent si on lit juste les titres

### Densité sémantique
- [ ] Mot-clé principal dans les 100 premiers mots
- [ ] Mot-clé répété naturellement (~tous les 100 mots)
- [ ] Synonymes et champ lexical présents (pas de répétition abusive)
- [ ] Mot-clé dans au moins une balise strong / gras
- [ ] Mot-clé dans le dernier paragraphe

### Contenu & EEAT
- [ ] Longueur adaptée (≥ 1500 mots pour un guide, ≥ 800 pour un article court)
- [ ] Exemples concrets (vraies marques, vrais cas, vrais chiffres)
- [ ] Sources externes citées
- [ ] Date de publication/mise à jour visible
- [ ] Auteur identifié
- [ ] Pas de phrases creuses / ton IA générique

### Multimédia
- [ ] Images avec attribut alt optimisé (mots-clés, sans bourrage)
- [ ] Noms de fichier images propres (tirets, minuscules, pas d'accent)

### Maillage & liens
- [ ] Au moins 3 liens internes vers d'autres pages du site
- [ ] 1-2 liens externes vers sources d'autorité
- [ ] Ancres de lien optimisées (pas « cliquez ici »)

### UX & format
- [ ] Paragraphes courts (3-5 phrases max)
- [ ] Utilisation de listes à puces ou numérotées
- [ ] Section FAQ ou Q/R intégrée
- [ ] Conclusion avec appel à l'action clair

## Format des recommandations

Pour chaque faiblesse détectée, rédiger ainsi :

```
❌ [Problème identifié]
Extrait concerné : « [citation exacte du texte] »
Pourquoi c'est un problème : [explication courte]
Correction proposée : « [réécriture concrète] »
Impact estimé : [faible / moyen / fort]
```

**Exemple concret** :

```
❌ Title trop long et sans mot-clé en début
Actuel : « Bienvenue sur le site de notre cabinet qui vous accompagne dans tous vos projets d'hypnothérapie à Paris et en région parisienne »
Pourquoi c'est un problème : 147 caractères (sera tronqué), le mot-clé « hypnothérapie Paris » arrive trop tard, aucune promesse.
Correction proposée : « Hypnothérapie Paris : cabinet spécialisé — 15 ans d'expérience »
Impact estimé : Fort (le title est l'élément le plus structurant pour le SEO et le CTR)
```

## Plan d'action synthétique

Terminer le rapport par un tableau priorisé :

| Priorité | Action | Effort | Impact |
|----------|--------|--------|--------|
| P1 | Réécrire le title pour y inclure « hypnothérapie Paris » en début | 5 min | Fort |
| P1 | Ajouter un H1 (actuellement absent) | 5 min | Fort |
| P2 | Étoffer la section « tarifs » (150 mots actuellement, cible 400) | 1h | Moyen |
| P3 | Ajouter une FAQ de 5 questions | 1h | Moyen |
| P3 | Optimiser les alt des 8 images | 20 min | Faible |

La colonne **Priorité** utilise :
- **P1** : action critique, à faire immédiatement (impact fort)
- **P2** : action importante, à faire dans la semaine
- **P3** : optimisation secondaire, à intégrer dans la durée

## Ton du rapport

Direct et sans langue de bois. L'utilisateur préfère « Ce title ne fonctionnera pas, voilà pourquoi » à « Il pourrait être intéressant d'envisager une révision du title ».

Éviter les félicitations gratuites. Si l'article a de vraies forces, les nommer précisément. Sinon, ne pas meubler.
