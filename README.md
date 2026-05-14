<div align="center">

# WxDeck

**Tableau de bord météo et ATIS pour contrôleurs aériens virtuels IVAO**

![Version](https://img.shields.io/github/v/release/favoniuskey/WxDeck?style=flat-square&color=2563eb)
![Windows](https://img.shields.io/badge/platform-windows-0078D6?style=flat-square&logo=windows)
![License](https://img.shields.io/badge/license-proprietary-red?style=flat-square)
![CI](https://img.shields.io/github/actions/workflow/status/favoniuskey/WxDeck/ci.yml?style=flat-square&label=build)

Par **Keywan D** (FavoniusKey)

</div>

---

## À propos

WxDeck est un panneau météo et ATIS conçu pour les contrôleurs virtuels du réseau IVAO. Il combine la lecture native du protocole Aurora ATC, les données METAR / TAF en temps réel via AVWX, et une réplique fidèle du système Pulsonic ALIZIA 0330 utilisé dans plusieurs aérodromes français.

Outil de **simulation uniquement**, non destiné à l'aviation réelle.

## Fonctionnalités

- Détection automatique de la position ATC via le VID IVAO (Whazzup v2).
- METAR / TAF en temps réel depuis l'API AVWX.
- Lecture native de l'ATIS via le protocole Aurora ATC (TCP).
- Diagramme de pistes orienté avec composantes de vent (face / arrière / travers) sur la piste préférentielle.
- Vérifications automatiques :
  - Cohérence piste annoncée à l'ATIS vs configuration préférentielle selon le vent.
  - Cohérence Transition Level vs QNH (table MANEX française).
  - Alertes rafales, cisaillement (WS), vent arrière, traversier.
- Mode **ALIZIA 0330** : réplique fidèle du boîtier Pulsonic (fenêtre flottante, déplaçable hors de l'app, always-on-top optionnel, polices 7 et 14 segments, modes Vent et Pression).
- Base de données de 130+ aéroports français (Métropole + Outre-Mer) avec pistes orientées, configurations légales, restrictions PEB.
- Mises à jour automatiques via GitHub Releases.
- Interface glassmorph compatible Windows 11 Mica.

## Installation

1. Télécharger le dernier `WxDeck-x.y.z-Setup.exe` depuis les [Releases](https://github.com/favoniuskey/WxDeck/releases).
2. Exécuter l'installeur. SmartScreen peut afficher un avertissement « Éditeur inconnu » ; cliquer sur **Informations complémentaires** puis **Exécuter quand même** (l'application n'est pas signée numériquement).
3. Au premier lancement, saisir votre **VID IVAO**.
4. Aurora doit être lancé et la position connectée pour la lecture de l'ATIS.

Les mises à jour sont vérifiées automatiquement au démarrage et téléchargées en arrière-plan.

## Stack technique

- Electron 33 + Vite 6
- React 18 + TypeScript
- TailwindCSS 3 + Lucide icons
- electron-updater + GitHub Releases
- API AVWX REST + Whazzup IVAO v2

## Développement

```powershell
# Installer les dépendances
npm install

# Créer le .env local (jamais commité)
cp .env.example .env
# Éditer .env et coller le token AVWX

# Lancer en dev (HMR renderer + watch main)
npm run dev

# Builder un installeur local
npm run pack
```

## Publication d'une release

Les builds officiels sont produits automatiquement par GitHub Actions sur push de tag.

```powershell
# Bump la version dans package.json (ex: 0.1.0 -> 0.1.1)
npm version patch    # ou minor / major
git push --follow-tags
```

GitHub Actions prend ensuite le relais : build sur `windows-latest`, signature du build (sans certif pour l'instant), publication automatique sur la page Releases. L'installeur apparaît sous quelques minutes et l'auto-updater des installations existantes le détecte.

## Configuration des secrets GitHub

Aller dans **Settings → Secrets and variables → Actions** et ajouter :

| Secret | Valeur |
|---|---|
| `AVWX_TOKEN` | Token d'API AVWX (chiffré dans le binaire au build) |

Le `GITHUB_TOKEN` est fourni automatiquement par Actions, pas besoin de le configurer.

## Aéroports supportés

Toutes les TA/TL conformes aux fiches IVAO MANEX France :

- **Métropole** : 5 000 ft (sauf LFLB à 6 500 ft)
- **Antilles** (TFFF, TFFR, TFFG) : 9 000 ft
- **Saint-Barthélémy** (TFFJ) : 1 500 ft
- **La Réunion** (FMEE, FMEP) : 12 000 ft
- **Mayotte** (FMCZ) : 4 000 ft
- **Guyane** (SOCA) : 3 000 ft
- **Nouvelle-Calédonie** (NWWW) : table TL fixe

La liste complète des aéroports avec leurs configurations légales se trouve dans `airports/*.json`.

## Avertissement

WxDeck est un outil pédagogique et de simulation conçu pour le réseau IVAO. Il **ne doit pas** être utilisé pour de l'aviation réelle, du contrôle aérien opérationnel, ou toute activité non simulée. Toutes les données affichées peuvent être incorrectes, obsolètes ou incomplètes.

## Licence

Tous droits réservés. Voir [LICENSE](LICENSE) pour les détails.

Le code source est publié à des fins de transparence, d'audit et de signalement de bugs. La redistribution, le fork commercial, et toute utilisation hors lecture personnelle nécessitent l'autorisation écrite de l'auteur.
