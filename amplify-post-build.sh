#!/bin/bash

# Custom script for AWS Amplify to handle SPA routing and file serving
# This helps prevent 404 errors for JavaScript chunks

echo "Setting up post-build configuration for SPA..."

# Create custom redirects for Amplify
cat > dist/raptor-gig/_redirects << EOF
# Fallback for client-side routing
/*    /index.html   200
EOF

# If using CloudFront, we might need additional headers
cat > dist/raptor-gig/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Handle Angular routing
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /index.html [QSA,L]
  
  # Set proper MIME types
  <FilesMatch "\.(js)$">
    Header set Content-Type "application/javascript"
  </FilesMatch>
</IfModule>
EOF

echo "Post-build configuration completed."
