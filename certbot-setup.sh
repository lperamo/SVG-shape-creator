#!/bin/sh
# =========================================================================
# POSIX Shell Automation Script for Certbot (Let's Encrypt)
# =========================================================================
# Crafted with care keeping the "Amstrad-ready" lightweight ethos.
# This script guides the installation, configuration, and automatic renewal
# of SSL certificates for your Nginx setup.

set -e

# Terminal colors for clean logging without bloating memory allocation
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
RESET='\033[0m'

echo "${BLUE}=== Certbot Installation & Configuration Assistant ===${RESET}"

# 1. Verification of Certbot availability
if ! command -v certbot >/dev/null 2>&1; then
    echo "${RED}[Error] Certbot is not installed on this system.${RESET}"
    echo "To install it:"
    echo "  - Debian/Ubuntu: apt-get update && apt-get install -y certbot python3-certbot-nginx"
    echo "  - CentOS/RHEL: dnf install -y certbot python3-certbot-nginx"
    exit 1
fi
echo "${GREEN}[OK] Certbot detected.${RESET}"

# 2. Verification of Nginx availability
if ! command -v nginx >/dev/null 2>&1; then
    echo "${RED}[Warning] Nginx is not detected locally.${RESET}"
    echo "Please execute this script directly on your production server."
fi

# Configuration directories
WEBROOT_DIR="/var/www/html/svg-shape-creator/dist"
DEFAULT_DOMAIN="shape.lionel-peramo.com"

echo ""
echo "This script helps you obtain an SSL certificate for your website."
echo "The default method used is ${GREEN}webroot${RESET}."
echo ""
echo "${RED}[Warning] The directory '$WEBROOT_DIR' only exists if you build the application first. ${RESET}"
echo "Before running Certbot, you must run in your project:"
echo "  ${GREEN}npm run build${RESET}"
echo "This will create the 'dist' folder containing production static assets!"
echo ""
echo "The configured webroot path is: ${BLUE}${WEBROOT_DIR}${RESET}"
echo ""

# Ensure that the webroot challenge directory exists
if [ ! -d "$WEBROOT_DIR" ]; then
    echo "[Info] Creating the webroot folder: $WEBROOT_DIR (Will be replaced upon next npm run build)"
    mkdir -p "$WEBROOT_DIR"
fi

# Execution options display
echo "---------------------------------------------------------"
echo "OPTION A: Automatic Webroot Command (Nginx stays online, requires 'dist' folder)"
echo "---------------------------------------------------------"
echo "${GREEN}sudo certbot certonly --webroot -w $WEBROOT_DIR -d $DEFAULT_DOMAIN${RESET}"
echo ""
echo "---------------------------------------------------------"
echo "OPTION B: Standalone Command (Temporarily stops Nginx, does not require 'dist')"
echo "---------------------------------------------------------"
echo "If you prefer obtaining the certificate without worrying about physical paths, use this one-liner alternative:"
echo "${GREEN}sudo systemctl stop nginx && sudo certbot certonly --standalone -d $DEFAULT_DOMAIN && sudo systemctl start nginx${RESET}"
echo ""
echo "If you have an existing ${GREEN}multisite/wildcard${RESET} certificate:"
echo "You can use Let's Encrypt DNS verification, or simply point your Nginx configuration files to your existing pem files:"
echo "  - Certificate:   /etc/letsencrypt/live/shape.lionel-peramo.com/fullchain.pem"
echo "  - Private Key:   /etc/letsencrypt/live/shape.lionel-peramo.com/privkey.pem"
echo "---------------------------------------------------------"

# 3. Diffie-Hellman (DH) parameters generation for enhanced security
# Uses 2048-bit size to limit memory allocation (suitable for lightweight VPS hosts and keeping memory footprint low)
DHPARAM_FILE="/etc/nginx/dhparam.pem"
echo ""
echo "${BLUE}=== Diffie-Hellman Cryptography & Security ===${RESET}"
if [ ! -f "$DHPARAM_FILE" ]; then
    echo "To reinforce transit security against passive decryption attacks, generate a safe 2048-bit Diffie-Hellman group:"
    echo "  ${GREEN}sudo openssl dhparam -out $DHPARAM_FILE 2048${RESET}"
    echo "Then, append this directive inside your Nginx 'server' configuration block:"
    echo "  ssl_dhparam $DHPARAM_FILE;"
else
    echo "${GREEN}[OK] Diffie-Hellman parameter file $DHPARAM_FILE is available on this system.${RESET}"
fi

# 4. Certificate Renewal Scheduling (Cron Job)
echo ""
echo "${BLUE}=== Automatic Certificate Renewal (Cron Job) ===${RESET}"
echo "Certbot typically schedules a systemd timer or cron job out of the box."
echo "To test and verify automatic renewal works cleanly on your system:"
echo "  ${GREEN}sudo certbot renew --dry-run${RESET}"
echo ""
echo "If no automatic tasks were configured, append this line inside your crontab (sudo crontab -e):"
echo "  ${GREEN}0 3 * * * certbot renew --post-hook 'systemctl reload nginx' > /dev/null 2>&1${RESET}"
echo "This task will execute daily at 3:00 AM, automatically renewing valid certificates when needed, and reloading Nginx cleanly."
echo "---------------------------------------------------------"

exit 0
