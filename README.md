# Stash - Next.js Bookmark Manager

A modern bookmark manager built with Next.js, Drizzle ORM, Turso (libsql), and local database-backed authentication.

## Features

- 🔐 Local authentication with bcrypt + JWT
- 📚 Bookmark management with URL title extraction
- 🏷️ Tag support for organizing bookmarks
- 🔍 Full-text search across bookmarks
- 📱 Responsive design with Tailwind CSS
- 🚀 Server-side rendering with Next.js
- 💾 Turso database with Drizzle ORM
- 🎨 Modern UI with Tailwind CSS and custom modals

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Turso (libsql) with Drizzle ORM
- **Authentication**: local users table + JWT
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Environment Variables

Set environment variables in `.env.local` or `.env` and fill in your credentials:

```bash
cp .env .env.local
```

Required environment variables:

```env
# Turso Database Configuration
TURSO_DATABASE_URL=your_turso_database_url_here
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# Local Auth Configuration
AUTH_JWT_SECRET=your_long_random_secret
APP_ID=local

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Setup

1. Create a Turso database:
   ```bash
   turso db create bookmark-app
   ```

2. Get your database URL and auth token:
   ```bash
   turso db show bookmark-app
   turso db tokens create bookmark-app
   ```

3. Generate and push the database schema:
   ```bash
    npm run db:generate
    npm run db:push
    ```

   Existing databases with legacy `bookmarks` data usually need ownership repair before this step. If your table only has one user row, `npm run create:admin` can claim orphaned bookmarks to that user automatically.

### 3. Verify Local Auth

Use this endpoint to confirm database connectivity and users table availability:

```bash
curl http://localhost:3000/api/test-auth
```

### 4. Create Your First Admin User

Use the bootstrap script to create an admin account directly in the local `users` table:

```bash
npm run create:admin -- \
  --email admin@example.com \
  --password 'StrongPassword123!'
```

  Optional:

  - `--firstName` (default: `Admin`)
  - `--lastName` (default: `User`)
  - `--role` (default: `admin`)
  - `--update` (overwrite password for an existing email)
  - `--claim` (claim unassigned bookmarks to the target user when multiple users exist)
  - `--no-claim` (skip bookmark claiming)

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run create:admin` - Create/update admin users
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification

### Bookmarks
- `GET /api/bookmarks` - Get all bookmarks (with optional search)
- `POST /api/bookmarks` - Create new bookmark
- `PUT /api/bookmarks/[id]` - Update bookmark
- `DELETE /api/bookmarks/[id]` - Delete bookmark

## Database Schema

The app uses two core tables:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  app_id TEXT NOT NULL DEFAULT 'local',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

`bookmarks` table:

```sql
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  domain TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

This app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Browser Extension Integration

The app supports URL parameters for easy integration with browser extensions:

- `?url=https://example.com` - Pre-fill URL
- `?title=Page Title` - Pre-fill title/notes
- `?text=Selected text` - Pre-fill notes

## User Interface Features

### Custom Modal System
The application uses custom dark-themed modals instead of browser alerts for:
- **Registration success/failure** - Elegant confirmation with automatic form switching
- **Login errors** - Clear error messaging with retry options
- **Bookmark operations** - Success confirmations for add/edit/delete actions
- **Delete confirmations** - Warning modals with clear action buttons

### Dark Mode Design
- **Login/Registration pages** - Full dark mode with gradient backgrounds
- **Form elements** - Dark inputs with blue accent colors
- **Modals** - Consistent dark theme with appropriate icons
- **High contrast** - Excellent readability and accessibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
