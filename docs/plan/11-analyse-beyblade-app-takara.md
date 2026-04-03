# Analyse : Beyblade X App Takara Tomy (version japonaise)

Source : APK decompile (`/root/apk-analysis/jp-xapk/`) — version 1.7.1

---

## 1. Fiche technique

| Info               | Hasbro (internationale)         | Takara Tomy (japonaise)              |
| ------------------ | ------------------------------- | ------------------------------------ |
| Package            | `com.hasbro.BeybladeX`         | `jp.co.takaratomy.beyblade`         |
| Version            | 1.5.1                          | **1.7.1** (plus recente)             |
| Unity              | IL2CPP (ancien)                | **Unity 6** (6000.0.62f1)           |
| SDK target         | 35 (Android 15)                | **36 (Android 16)**                  |
| SDK min            | 24 (Android 7.0)               | **29 (Android 10)**                  |
| Taille             | 689 Mo                         | 554 Mo                               |
| AR                 | ARCore + OpenCV                | **Vuforia** + ARCore                 |
| Scan               | OpenCV + ZXing QR              | **Vuforia image tracking**           |
| Bluetooth          | Non                            | **BLE** (UnityBluetoothLE)           |
| Multijoueur        | Photon Realtime + Chat         | **gRPC** + Firebase Firestore        |
| Audio              | FMOD Studio                    | Unity BGMs natif                     |
| Asset bundles      | 23 (non chiffres)              | 13 (chiffres/obfusques)             |
| Langues            | 6+                             | 100+ locales                         |

---

## 2. Differences majeures

### Bluetooth Low Energy (BLE) — Feature exclusive Takara

La version japonaise integre **UnityBluetoothLE** — un systeme complet de communication Bluetooth LE pour interagir avec les **puces NFC integrees dans les toupies physiques** Takara Tomy.

**Permissions BLE** :
- `BLUETOOTH_SCAN` — Detecter les toupies a proximite
- `BLUETOOTH_CONNECT` — Se connecter aux puces NFC
- `BLUETOOTH_ADVERTISE` — S'annoncer pour les features sociales
- `ACCESS_FINE_LOCATION` — Requis pour le scan BLE sur Android
- `HIGH_SAMPLING_RATE_SENSORS` — Capteurs haute frequence (gyroscope pour mesurer les stats de rotation)

**Fonctionnement** :
1. L'utilisateur approche sa toupie du telephone
2. La puce NFC dans la toupie est lue via BLE
3. Les stats reelles de la toupie (vitesse, rotations, usure) sont importees
4. Le profil numerique de la toupie est mis a jour avec des donnees reelles

> C'est le systeme **BeyLink** — le pont physique-numerique qui fait la force de la version Takara.

### Vuforia AR — Scan avance

Au lieu d'OpenCV (Hasbro), Takara utilise **Vuforia** (SDK AR professionnel) pour le scan de cartes/images.

Config Vuforia detectee :
```xml
<ImageTarget name="korea_noicon" size="1.000 x 1.524" />
<ImageTarget name="korea_icon" size="1.000 x 1.524" />
<ImageTarget name="t20230223_noicon" size="1.000 x 1.385" />
<ImageTarget name="t20230223_icon" size="1.000 x 1.385" />
```

Les targets incluent des designs coreen et japonais — l'app supporte la region Asie.

### Architecture serveur differente

| Aspect        | Hasbro                    | Takara Tomy                   |
| ------------- | ------------------------- | ----------------------------- |
| PvP           | Photon Realtime           | gRPC                          |
| Chat          | Photon Chat               | Firebase Cloud Messaging      |
| Base de donnees| Photon + custom           | **Firebase Firestore**        |
| Notifications | Non                       | Firebase + Android Notifications |
| Auth          | JWT                       | Google Sign-In + JWT          |

Takara utilise l'ecosysteme **Google/Firebase** complet, suggerant une architecture plus moderne et scalable.

### Bundles uniques

| Bundle Hasbro               | Bundle Takara                        | Difference                                  |
| --------------------------- | ------------------------------------ | ------------------------------------------- |
| `battlepass_assets`         | -                                    | Hasbro a un battle pass                     |
| `leagues_assets`            | -                                    | Hasbro a des ligues                         |
| `wc2025_assets`             | -                                    | Hasbro a le World Championship              |
| -                           | `beyblades_customize`                | **Takara a la customisation de toupies**    |
| -                           | `massprotimelines`                   | **Takara a le "Mass Pro" (timeline de production)** |
| -                           | `rarebeygetbattlevideos`             | **Takara a des videos de "Rare Bey Get"**   |
| `attackcutscenes-*`         | -                                    | Hasbro a les cutscenes de type element      |
| `beybladetrails_assets`     | -                                    | Hasbro a les trainees de combat             |
| `portraitframes-*`          | -                                    | Hasbro a les frames portrait                |

### Systemes exclusifs Takara

1. **BeyLink** — Liaison physique-numerique via BLE/NFC
2. **Beyblades Customize** — Customisation poussee des toupies
3. **Mass Pro Timelines** — Historique de production des toupies (versions, lots)
4. **Rare Bey Get** — Systeme d'acquisition de toupies rares avec videos

### Systemes exclusifs Hasbro

1. **Battle League** — Ligues competitives
2. **Season Track / Battle Pass** — Progression saisonniere
3. **World Championship 2025** — Evenement mondial
4. **Portrait Frames** — 30+ cadres thematiques
5. **Clans** — Systeme d'equipes
6. **Cutscenes elementaires** — Animations par type (feu, glace, vent, terre)
7. **Trails de combat** — Effets visuels de trainee

---

## 3. Securite et obfuscation

La version Takara est **beaucoup plus securisee** :
- Assets chiffres avec noms aleatoires (ex: `07pmd8vmRem7qNTd`)
- Code obfusque (packages renommes: `jp.co.takaratomy.beyblade.qEh.ljBu`)
- Pas d'assets visuels extractibles directement (contrairement a Hasbro)
- Firebase Security Rules probablement configurees

La version Hasbro laisse tous ses sprites, textures et modeles 3D en clair.

---

## 4. Ce qu'on retient pour RPB

### Concepts Takara a integrer

| Concept Takara               | Adaptation RPB                                           |
| ---------------------------- | -------------------------------------------------------- |
| **BeyLink (physique→num)**   | QR code scan pour importer les combos dans le profil     |
| **Customize**                | Notre builder de deck fait deja ca                       |
| **Mass Pro Timeline**        | Timeline des releases produit (historique par generation) |
| **Rare Bey Get**             | Systeme de rarete TCG (deja en place)                    |
| **Firebase Firestore**       | Notre Prisma/PostgreSQL est plus puissant                |
| **gRPC backend**             | Notre REST + WebSocket suffit pour le web                |

### Concepts Hasbro a integrer (deja documentes)

| Concept Hasbro               | Statut RPB                                               |
| ---------------------------- | -------------------------------------------------------- |
| Battle League                | Rankings deja en place                                   |
| Season Track                 | TCG drops saisonniers                                    |
| Portrait Frames              | A implementer (systeme de cadres deblocables)            |
| Clans                        | Futur potentiel                                          |
| Badges                       | A implementer                                            |

### Points forts de la version Takara pour nous

1. **L'approche physique-numerique** est le futur du Beyblade competitif — RPB est bien place avec la communaute physique qui utilise le dashboard
2. **La customisation** est plus poussee cote Takara — notre builder de deck doit etre a ce niveau
3. **La securite** de Takara montre qu'ils protegent leurs assets — nous on peut beneficier de leurs assets Hasbro en clair pour enrichir notre base

---

## 5. Resume comparatif des 3 plateformes

| Feature              | Hasbro App      | Takara App      | RPB Dashboard       |
| -------------------- | --------------- | --------------- | ------------------- |
| Type                 | App Unity       | App Unity       | **Web app Next.js** |
| Battle PvP           | Oui (Photon)    | Oui (gRPC)      | Non (tournois IRL)  |
| Collection           | Oui             | Oui + BLE scan  | Oui (Prisma DB)     |
| Rankings             | Leagues         | -               | **Oui (complet)**   |
| Tournaments          | WC2025          | -               | **Oui (Challonge)** |
| Social               | Clans + Friends | -               | **Discord integre** |
| Customisation        | Decks           | **Avancee**     | Deck builder        |
| Gamification         | Battle Pass     | Rare Bey Get    | **TCG Gacha**       |
| Scan physique        | Camera (OpenCV) | **BLE + Vuforia**| QR codes           |
| Dark theme           | Non (light)     | Inconnu         | **Oui (MD3 Exp)**   |
| Animations           | Basiques        | Basiques        | **Spring physics**  |
| Open/Accessible      | App store only  | Japon only      | **Web ouvert**      |
| Communaute           | In-app          | In-app          | **Discord + Web**   |
