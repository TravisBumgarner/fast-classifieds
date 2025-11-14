echo "Starting bootstrap process..."

echo "Installing npm packages..."
npm install

echo "Setting up the database..."
npm run db:generate

echo "Applying database migrations..."
npm run db:apply

echo "Bootstrap complete."