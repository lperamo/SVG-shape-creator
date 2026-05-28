#!/bin/sh
# =========================================================================
# Script POSIX d'automatisation et de renouvellement Certbot (Let's Encrypt)
# =========================================================================
# Conçu avec amour dans l'esprit "Amstrad-ready" (léger, efficace, fiable).
# Ce script aide à installer, configurer et planifier les renouvellements
# de vos certificats SSL pour votre configuration Nginx multisite.

set -e

# Couleurs pour un affichage propre sans surcharger la mémoire
VERT='\033[0;32m'
BLEU='\033[0;34m'
ROUGE='\033[0;31m'
NEUTRE='\033[0m'

echo "${BLEU}=== Assistance d'installation et configuration Certbot ===${NEUTRE}"

# 1. Vérification de la présence de Certbot
if ! command -v certbot >/dev/null 2>&1; then
    echo "${ROUGE}[Erreur] Certbot n'est pas installé sur ce système.${NEUTRE}"
    echo "Pour l'installer :"
    echo "  - Debian/Ubuntu : apt-get update && apt-get install -y certbot python3-certbot-nginx"
    echo "  - CentOS/RHEL : dnf install -y certbot python3-certbot-nginx"
    exit 1
fi
echo "${VERT}[OK] Certbot détecté.${NEUTRE}"

# 2. Vérification de la présence de Nginx
if ! command -v nginx >/dev/null 2>&1; then
    echo "${ROUGE}[Attention] Nginx n'est pas détecté localement.${NEUTRE}"
    echo "Veuillez exécuter ce script directement sur votre serveur de production."
fi

# Répertoires de configuration
WEBROOT_DIR="/var/www/svg-shape-creator/dist"
DOMAINE_PAR_DEFAUT="votre-domaine.com"

echo ""
echo "Ce script va vous aider à obtenir un certificat SSL pour votre site."
echo "La méthode utilisée est celle du ${VERT}webroot${NEUTRE}."
echo "Elle permet d'obtenir un certificat sans couper Nginx ni perturber les autres sites."
echo "Le chemin webroot configuré est : ${BLEU}${WEBROOT_DIR}${NEUTRE}"
echo ""

# S'assurer que le dossier webroot pour le challenge existe
if [ ! -d "$WEBROOT_DIR" ]; then
    echo "[Info] Création du dossier webroot : $WEBROOT_DIR"
    mkdir -p "$WEBROOT_DIR"
fi

# Demande d'informations à l'utilisateur (ou affichage des commandes si non-interactif)
echo "---------------------------------------------------------"
echo "Pour obtenir une clé sécurisée pour vos domaines, lancez la commande suivante :"
echo "---------------------------------------------------------"
echo "${VERT}sudo certbot certonly --webroot -w $WEBROOT_DIR -d $DOMAINE_PAR_DEFAUT -d www.$DOMAINE_PAR_DEFAUT${NEUTRE}"
echo ""
echo "Si vous avez un certificat ${VERT}multisite/wildcard${NEUTRE} existant :"
echo "Vous pouvez utiliser la méthode DNS de Let's Encrypt, ou simplement mapper le chemin des fichiers pem :"
echo "  - Certificat :   /etc/letsencrypt/live/votre-domaine.com/fullchain.pem"
echo "  - Clé privée :   /etc/letsencrypt/live/votre-domaine.com/privkey.pem"
echo "---------------------------------------------------------"

# 3. Génération des paramètres DH (Diffie-Hellman) pour un chiffrement renforcé
# On utilise une taille de 2048 bits pour éviter de saturer la mémoire (idéal Amstrad/VPS léger)
DHPARAM_FILE="/etc/nginx/dhparam.pem"
echo ""
echo "${BLEU}=== Chiffrement & Sécurité Diffie-Hellman ===${NEUTRE}"
if [ ! -f "$DHPARAM_FILE" ]; then
    echo "Pour renforcer la sécurité contre les attaques de déchiffrement passif, générez un groupe Diffie-Hellman de 2048 bits (léger et sécurisé) :"
    echo "  ${VERT}sudo openssl dhparam -out $DHPARAM_FILE 2048${NEUTRE}"
    echo "Puis, ajoutez cette règle dans le bloc 'server' de votre Nginx :"
    echo "  ssl_dhparam $DHPARAM_FILE;"
else
    echo "${VERT}[OK] Le fichier $DHPARAM_FILE est disponible sur votre système.${NEUTRE}"
fi

# 4. Planification du renouvellement (Cron Job)
echo ""
echo "${BLEU}=== Automatisation du renouvellement (Cron Job) ===${NEUTRE}"
echo "Certbot configure souvent un timer systemd ou un cron par défaut."
echo "Pour vérifier la validité de la tâche de renouvellement automatique :"
echo "  ${VERT}sudo certbot renew --dry-run${NEUTRE}"
echo ""
echo "Si ce n'est pas automatisé, ajoutez cette ligne dans votre crontab (sudo crontab -e) :"
echo "  ${VERT}0 3 * * * certbot renew --post-hook 'systemctl reload nginx' > /dev/null 2>&1${NEUTRE}"
echo "Cette tâche s'exécutera tous les jours à 3h00 du matin, renouvellera le certificat si nécessaire et rechargera proprement Nginx."
echo "---------------------------------------------------------"

exit 0
