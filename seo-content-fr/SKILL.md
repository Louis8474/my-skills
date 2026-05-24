---
name: seo-content-fr
description: "Rédige, analyse et planifie du contenu SEO en français optimisé pour Google. Utilise ce skill systématiquement dès que l'utilisateur demande de rédiger un article de blog, optimiser un texte existant, auditer le SEO d'une page, trouver des mots-clés, proposer des sujets d'articles, construire un cocon sémantique, rédiger une balise title/meta description, ou toute tâche liée au référencement naturel en français. Déclenche aussi sur les termes : SEO, référencement, article optimisé, mots-clés, contenu web, stratégie éditoriale, cocon sémantique, backlinks, EEAT, featured snippet, position 0."
---

# SEO Content FR — Rédaction et analyse SEO en français

## Vue d'ensemble

Ce skill couvre 4 usages distincts autour du SEO en français :

1. **Rédiger** un article de blog optimisé SEO à partir d'un brief ou d'un mot-clé
2. **Analyser / auditer** un article existant et proposer des améliorations concrètes
3. **Proposer des sujets d'articles** pour une thématique ou un secteur donné
4. **Proposer des mots-clés** à cibler (courte, moyenne, longue traîne) avec intention de recherche

Avant toute chose : **identifier la tâche réelle**. Ne pas dérouler un audit complet si l'utilisateur demande juste un title. Ne pas rédiger un article si l'utilisateur demande des idées de sujets.

## Principes SEO fondamentaux à toujours respecter

Ces principes guident toutes les productions du skill. Ils viennent de la pratique SEO moderne (post-2024, ère EEAT / Helpful Content Update).

### La règle d'or : EEAT

Tout contenu doit démontrer :
- **E**xperience : preuves que l'auteur a vécu le sujet (cas concrets, données chiffrées, témoignages)
- **E**xpertise : vocabulaire précis, sources citées, rigueur
- **A**utorité : mentions externes, références reconnues
- **T**rust : auteur identifié, contenu daté et vérifiable

Quand Claude rédige, il doit **ancrer le contenu dans le réel** : exemples concrets, chiffres sourcés, citations d'études, scénarios précis. Éviter absolument le ton générique « IA » : phrases creuses, listes bateau, synonymes inutiles.

### Une page = un mot-clé cible = un sujet

Chaque article vise UNE intention de recherche principale. Si l'utilisateur propose un sujet trop large, proposer de le découper en plusieurs articles (cocon sémantique).

### Les 4 intentions de recherche

Toujours qualifier l'intention avant de rédiger :
- **Informationnelle** : « comment », « pourquoi », « qu'est-ce que » → article de fond, guide
- **Navigationnelle** : recherche d'une marque/site précis → peu d'intérêt éditorial
- **Commerciale** : « meilleur », « comparatif », « top X » → article comparatif
- **Transactionnelle** : « acheter », « prix », « devis » → page de vente, pas article

⚠️ Vérifier la SERP mentalement avant de rédiger : si on cherche un mot-clé et que Google ne ressort que des fiches produit, inutile d'écrire un article informationnel dessus.

## Workflows

### Workflow 1 — Rédiger un article optimisé

Lire `references/redaction.md` pour la checklist détaillée et les règles de chaque élément (title, meta, Hn, contenu, maillage).

**Étapes en ordre** :

1. **Clarifier le brief si nécessaire**. Si l'utilisateur donne juste un mot-clé sans contexte, demander en UNE question : audience cible, intention (informationnelle / commerciale), longueur souhaitée. Si les infos sont dans la conversation, ne pas redemander.

2. **Poser la structure AVANT de rédiger**. Toujours produire d'abord :
   - Le mot-clé principal cible
   - L'intention de recherche identifiée
   - La balise `<title>` (35-65 caractères, mot-clé en début)
   - La meta description (≤ 135 caractères, incitative)
   - L'URL suggérée (courte, tirets, mot-clé)
   - Le plan Hn (un seul H1, H2 cohérents)

   Montrer cette structure à l'utilisateur avant de rédiger les 1500-3000 mots. Cela évite de tout refaire si le plan ne convient pas. EXCEPTION : si l'utilisateur a explicitement demandé « rédige l'article complet directement », enchaîner.

3. **Rédiger selon la checklist de `references/redaction.md`**. Longueur cible par défaut : **1800-2500 mots** pour un article de fond informationnel, 1200-1500 pour un article court, sauf indication contraire.

4. **Inclure systématiquement** :
   - Un chapô / introduction qui contient le mot-clé principal dans les 100 premiers mots
   - Des sous-titres H2 qui contiennent des variations sémantiques
   - Du maillage interne (marqueurs `[lien interne : sujet]` quand Claude ne connaît pas les URLs réelles)
   - 2-3 questions/réponses au format FAQ pour viser les *People Also Ask* et la position 0
   - Une conclusion avec un appel à l'action clair

5. **Format de livraison** : pour un article complet, créer un **fichier Markdown** dans `/mnt/user-data/outputs/` (l'utilisateur pourra le copier dans son CMS). Pour un article court ou une section, réponse inline est OK.

### Workflow 2 — Analyser / auditer un article

Lire `references/audit.md` pour la grille d'audit détaillée.

L'utilisateur fournit généralement : un texte collé, un fichier, ou une URL (à lire avec `web_fetch` si disponible).

**Produire un audit structuré** avec :
- **Score global** sur 100 avec 4 sous-scores : Sémantique / Structure / Contenu / UX-lisibilité
- **Forces** (3-5 points concrets)
- **Faiblesses critiques** (ce qui bloque le SEO)
- **Plan d'action priorisé** : actions à fort impact d'abord (title, H1, contenu manquant), optimisations secondaires ensuite
- **Réécriture** des éléments les plus problématiques (title, meta, intro) directement proposée

Ne JAMAIS faire un audit générique copier-coller. Chaque point doit pointer une phrase, un paragraphe, un élément précis de l'article analysé. Citer le texte original pour contextualiser.

### Workflow 3 — Proposer des sujets d'articles

Lire `references/ideation.md` pour la méthodologie complète.

Principe : partir de **l'intention utilisateur** et de la **structure cocon**, pas d'une liste au hasard.

Sortie attendue : un tableau avec pour chaque sujet :
- **Titre d'article proposé** (accrocheur, mot-clé inclus)
- **Mot-clé principal cible**
- **Intention de recherche**
- **Difficulté estimée** (faible / moyenne / forte) — basée sur la concurrence probable
- **Volume estimé** (ordre de grandeur si connu, sinon « à vérifier sur Keyword Planner »)
- **Angle éditorial** (ce qui différencie vs ce qui existe déjà sur Google)

Proposer typiquement **8-15 sujets** organisés en cocon (1 page mère + pages filles), pas une liste à plat.

⚠️ Claude ne peut pas inventer de volumes de recherche précis. Toujours préciser que les volumes exacts doivent être vérifiés via Keyword Planner, Semrush, Haloscan ou Ubersuggest.

### Workflow 4 — Proposer des mots-clés

Lire `references/keywords.md` pour la méthodologie.

Sortie attendue : un tableau hiérarchisé avec :
- **Courte traîne** (1 mot, fort volume, forte concurrence) — 3-5 KW
- **Moyenne traîne** (2-3 mots, volume moyen) — 8-15 KW
- **Longue traîne** (4+ mots, volume faible mais conversion élevée) — 15-30 KW

Chaque mot-clé accompagné de son **intention** (I/N/C/T) et d'une **note sur la difficulté**.

Toujours inclure des **variantes** : singulier/pluriel, synonymes, champ lexical, questions (« comment », « pourquoi », « quel »).

## Règles transverses de rédaction

Ces règles s'appliquent partout, pas juste aux workflows. Voir `references/redaction.md` pour le détail.

### Éviter le ton « IA générique »

- **Pas de phrases d'amorce creuses** : « Dans un monde en constante évolution », « À l'ère du numérique », « Il est indéniable que »
- **Pas de listes à puces bateau** qui répètent le sujet sans apporter d'info neuve
- **Pas de conclusions qui résument ce qui vient d'être dit** sans ajouter de valeur
- **Pas de synonymes forcés** (« utiliser / employer / exploiter / mobiliser » à la suite)
- **Pas d'emojis** sauf demande explicite
- **Pas de tirets cadratins** abusifs (« — en effet — ») — utiliser la ponctuation normale

### Privilégier

- **Exemples concrets et chiffrés** (une vraie entreprise, un vrai chiffre, une vraie étude)
- **Phrases courtes** quand possible (rythme)
- **Verbes actifs** (pas de passif inutile)
- **Données vérifiables** avec source mentionnée
- **Anecdotes courtes** quand pertinentes

### Respecter la densité de mots-clés

- Mot-clé principal tous les ~100 mots, **naturellement**
- Utiliser des synonymes et le champ lexical pour éviter la suroptimisation
- Placer le mot-clé dans : title (début), H1, URL, premiers 100 mots, dernier paragraphe, alt d'au moins une image

### Maillage interne

Lorsque Claude rédige, il ne connaît pas les URLs exactes du site. Il doit :
- Signaler les opportunités de maillage avec `[lien interne : sujet à relier]`
- Suggérer 3-5 liens internes pertinents par article (vers pages mères, articles connexes)
- Suggérer 1-2 liens externes vers des sources d'autorité (études, sites officiels)

## Principes de communication avec l'utilisateur

- **Ne pas sur-expliquer le SEO** : l'utilisateur de ce skill connaît les bases. Aller à l'essentiel.
- **Ne pas lister toutes les règles à chaque réponse**. Les règles sont dans les fichiers de référence et dans la tête de Claude. La sortie doit être du contenu ou des recommandations, pas un cours magistral.
- **Être direct sur les compromis SEO** : si un choix de mot-clé est mauvais, le dire. Si un article est trop court pour être compétitif, le dire. L'utilisateur préfère la vérité utile à la flagornerie.

## Fichiers de référence

Consulter ces fichiers selon le workflow déclenché :

- `references/redaction.md` — Checklist complète pour rédiger (title, meta, Hn, contenu, images, maillage). **Lire pour Workflow 1**.
- `references/audit.md` — Grille d'audit SEO en 25 points, format de rapport. **Lire pour Workflow 2**.
- `references/ideation.md` — Méthode de génération de sujets, structure cocon. **Lire pour Workflow 3**.
- `references/keywords.md` — Méthode keyword research, classification intentions, outils. **Lire pour Workflows 3 et 4**.
- `references/outils.md` — Liste des outils SEO mentionnables (Search Console, Semrush, Haloscan, Answerthepublic, Screaming Frog, etc.) avec quand les recommander.
