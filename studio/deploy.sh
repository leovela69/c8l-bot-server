#!/bin/bash
# === DEPLOY C8L Creative Studio en Hostinger VPS ===
# Ejecutar como: bash deploy.sh

set -e

echo "🎨 Desplegando C8L Creative Studio..."

# 1. Crear directorio de outputs
mkdir -p /home/ubuntu/outputs

# 2. Instalar dependencias del sistema
sudo apt-get update -y
sudo apt-get install -y ffmpeg python3-pip python3-venv nginx

# 3. Crear entorno virtual
cd /home/ubuntu/c8l-bot-server/studio
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Crear servicio systemd
sudo tee /etc/systemd/system/creative-studio.service > /dev/null <<EOF
[Unit]
Description=C8L Creative Studio
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/c8l-bot-server/studio
Environment="PATH=/home/ubuntu/c8l-bot-server/studio/venv/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=/home/ubuntu/c8l-bot-server/studio/.env
ExecStart=/home/ubuntu/c8l-bot-server/studio/venv/bin/gunicorn -w 2 -b 0.0.0.0:8084 creative_studio_cloud:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 5. Configurar Nginx
sudo tee /etc/nginx/sites-available/c8l-studio > /dev/null <<EOF
server {
    listen 80;
    server_name studio.c8l.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8084;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    location /outputs/ {
        alias /home/ubuntu/outputs/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 6. Activar sitio Nginx
sudo ln -sf /etc/nginx/sites-available/c8l-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Activar y arrancar servicio
sudo systemctl daemon-reload
sudo systemctl enable creative-studio
sudo systemctl start creative-studio

echo ""
echo "✅ C8L Creative Studio desplegado!"
echo "📡 API: http://tu-ip:8084/api/status"
echo "🌐 Nginx: http://studio.c8l.com"
echo ""
echo "📋 Endpoints disponibles:"
echo "   POST /api/canva/design    — Crear diseño"
echo "   POST /api/adobe/edit      — Editar imagen"
echo "   POST /api/ai/image        — Generar imagen IA"
echo "   POST /api/ai/video        — Generar video IA"
echo "   POST /api/flow/contenido  — Flujo de contenido"
echo "   POST /api/flow/batch      — Batch de imágenes"
echo "   POST /api/export          — Exportar formato"
echo "   GET  /api/status          — Estado del sistema"
echo ""
echo "⚠️  Recuerda configurar .env con tus API keys!"
