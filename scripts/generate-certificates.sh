#!/bin/bash
# Script to generate self-signed SSL certificates for development

# Create certs directory if it doesn't exist
mkdir -p ./certs

# Generate certificates
echo "Generating self-signed SSL certificates for development..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certs/key.pem \
  -out ./certs/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "Certificates generated successfully at:"
echo "  - Private key: ./certs/key.pem"
echo "  - Certificate: ./certs/cert.pem"
echo ""
echo "NOTE: These are self-signed certificates suitable for development only."
echo "      For production, use properly signed certificates from a trusted CA."
