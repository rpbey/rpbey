# Configuration de l'affichage distant (X11 Forwarding)
## Serveur Ubuntu -> WSL2 (Windows via WSLg)

Ce guide explique comment afficher une fenêtre Chrome (ou tout autre outil graphique/scrappeur) s'exécutant sur un serveur Ubuntu distant directement sur votre bureau Windows en utilisant WSL2 et WSLg.

### 1. Prérequis sur le Serveur Ubuntu (Distant)

Vous devez installer les outils nécessaires pour gérer l'authentification X11.

```bash
sudo apt-get update
sudo apt-get install -y xauth xvfb
```

#### Configuration SSH (serveur)
Éditez le fichier `/etc/ssh/sshd_config` :
```bash
sudo nano /etc/ssh/sshd_config
```
Assurez-vous que les lignes suivantes sont présentes et décommentées :
```ssh
X11Forwarding yes
X11DisplayOffset 10
X11UseLocalhost no
```
Redémarrez le service SSH :
```bash
sudo systemctl restart ssh
```

### 2. Connexion depuis WSL2 (Windows)

Depuis votre terminal WSL2 sur Windows (qui gère nativement WSLg), connectez-vous au serveur en activant le transfert X11 avec l'option `-Y` (Trusted X11 Forwarding).

```bash
ssh -Y utilisateur@ip-du-serveur
```

Une fois connecté, vérifiez que la variable d'environnement `DISPLAY` est bien définie :
```bash
echo $DISPLAY
# Devrait afficher quelque chose comme localhost:10.0
```

### 3. Utilisation avec un Scrappeur (Playwright / Puppeteer)

Pour voir la fenêtre s'ouvrir sur votre bureau Windows, vous devez forcer le mode **headed** (non-headless) dans votre code.

#### Exemple Node.js (Playwright) :
```javascript
const { chromium } = require('playwright');

async function run() {
  // headless: false est INDISPENSABLE pour l'affichage
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox'] // Souvent nécessaire en root/docker
  });
  const page = await browser.newPage();
  await page.goto('https://rpbey.fr');
  
  console.log("Fenêtre ouverte sur Windows !");
}
run();
```

#### Exemple Python (Playwright) :
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://rpbey.fr")
    # Maintenir ouvert pour voir
    input("Appuyez sur Entrée pour fermer...")
    browser.close()
```

### 4. Dépannage

- **Erreur "Gtk-WARNING: cannot open display"** : 
  Vérifiez que vous avez utilisé `-Y` lors du SSH. Testez avec une application simple : `sudo apt install x11-apps && xclock`.
- **Bibliothèques manquantes** : 
  Si Chrome refuse de se lancer, installez les dépendances système :
  `npx playwright install-deps`
- **WSLg** : 
  Assurez-vous que votre Windows est à jour (Windows 10 build 19044+ ou Windows 11). WSLg est automatique sur ces versions.
