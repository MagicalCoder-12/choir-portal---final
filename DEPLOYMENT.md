# Deployment Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-here-change-this-in-production"
NEXTAUTH_URL="https://your-domain.com"

# Node Environment
NODE_ENV="production"
```

## Generate a Secure NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## Database Setup

1. **Push the database schema:**
   ```bash
   npm run db:push
   ```

2. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

3. **Seed the database (optional):**
   ```bash
   npx tsx prisma/seed.ts
   ```

## Build the Application

```bash
npm run build
```

## Start the Production Server

```bash
npm start
```

## Deployment Platforms

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add the environment variables in Vercel dashboard
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add `prisma/seed.ts` as a build script if you want to seed the database

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy next.config.js and other config files
COPY next.config.ts ./
COPY tsconfig.json ./

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### Traditional Server

1. **Upload files** to your server
2. **Install dependencies:** `npm ci --production`
3. **Build:** `npm run build`
4. **Start:** `npm start`

## Post-Deployment Steps

1. **Test the application** by visiting your domain
2. **Test admin login:** Use `admin@harmonychoir.com` / `admin123`
3. **Verify database connectivity** by checking if songs load properly
4. **Test authentication** by logging in and out

## Troubleshooting

### Common Issues

1. **NEXTAUTH_SECRET not set:**
   - Make sure to set the NEXTAUTH_SECRET environment variable
   - Generate a new secret using `openssl rand -base64 32`

2. **Database connection issues:**
   - Verify DATABASE_URL is correct
   - Run `npm run db:push` to ensure schema is up to date
   - Check file permissions for the database file

3. **Build errors:**
   - Clean build directory: `rm -rf .next`
   - Rebuild: `npm run build`
   - Check for missing dependencies

4. **Authentication not working:**
   - Verify NEXTAUTH_URL matches your domain exactly
   - Check that cookies are being set properly
   - Ensure database has been seeded with admin user

## Environment-Specific Notes

### Development
- Uses `nodemon` for hot reloading
- Database file: `db/custom.db`
- No need for NEXTAUTH_SECRET (but recommended)

### Production
- Uses `tsx` for running the server
- Database file should be in a persistent location
- NEXTAUTH_SECRET is required
- Set NODE_ENV=production

## Security Considerations

1. **Change the default admin password** after first login
2. **Use a strong NEXTAUTH_SECRET** (32+ characters)
3. **Set up HTTPS** in production
4. **Restrict database file permissions**
5. **Regular backups** of the database file

## Monitoring

Check the server logs for:
- Database connection errors
- Authentication failures
- Missing environment variables
- Build or runtime errors

The application logs to both console and a `server.log` file in production.