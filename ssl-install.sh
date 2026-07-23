#!/bin/bash
# 9JASUB SSL Installation Script for Hostinger VPS (Ubuntu)
# Run as root

set -e

echo "🔒 Starting Nginx and SSL Configuration for 9JASUB..."

# 1. Update and install Nginx if not present
apt update
apt install -y nginx

# 2. Create SSL directory
mkdir -p /etc/nginx/ssl
chmod 700 /etc/nginx/ssl

echo "=========================================================="
echo "ACTION REQUIRED: Create Cloudflare Origin Certificate"
echo "=========================================================="
echo "1. Go to Cloudflare Dashboard -> SSL/TLS -> Origin Server"
echo "2. Click 'Create Certificate'"
echo "3. Keep default settings (RSA, covers *.9jasub.com and 9jasub.com)"
echo "4. Paste the 'Origin Certificate' into /etc/nginx/ssl/9jasub.com.pem"
echo "5. Paste the 'Private Key' into /etc/nginx/ssl/9jasub.com.key"
echo "=========================================================="
read -p "Press ENTER when you have created these files on the server..."

# 3. Check if files exist
if [ ! -f /etc/nginx/ssl/9jasub.com.pem ] || [ ! -f /etc/nginx/ssl/9jasub.com.key ]; then
    echo "❌ Error: SSL files not found in /etc/nginx/ssl/. Aborting."
    exit 1
fi

chmod 600 /etc/nginx/ssl/9jasub.com.*

# 4. Copy Nginx Configuration
echo "⚙️ Configuring Nginx..."
cp nginx.conf.example /etc/nginx/sites-available/9jasub
ln -sf /etc/nginx/sites-available/9jasub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 5. Test and Restart Nginx
nginx -t
systemctl restart nginx

echo "✅ Nginx configured successfully with Wildcard SSL."
echo "IMPORTANT: Ensure Cloudflare SSL mode is set to 'Full (strict)'."
