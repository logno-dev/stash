# Stash - Next.js Bookmark Manager

A modern bookmark manager built with Next.js, Drizzle ORM, Turso (libsql), and auth.bunch.codes authentication.

## Features

- 🔐 Authentication via auth.bunch.codes
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
- **Authentication**: auth.bunch.codes
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Environment Variables

Copy the `.env.example` file to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Turso Database Configuration
TURSO_DATABASE_URL=your_turso_database_url_here
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# Auth.bunch.codes Configuration
AUTH_API_KEY=your_auth_api_key_here
AUTH_APP_ID=your_auth_app_id_here
AUTH_BASE_URL=https://your-auth-server.com/api

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

### 3. Auth.bunch.codes Setup

1. Contact your system administrator to register your app
2. Get your API key, App ID, and base URL
3. Update your `.env.local` file with these credentials

**Note**: If you encounter a 405 error during registration/login, it means the auth.bunch.codes service is not properly configured. The application includes a fallback authentication system that will automatically activate when the main auth service is unavailable. This allows you to test the application functionality while setting up the proper auth service.

#### Troubleshooting Auth Issues

If you see errors like "Request failed with status code 405":

1. **Check your environment variables** - Make sure `AUTH_BASE_URL`, `AUTH_API_KEY`, and `AUTH_APP_ID` are correctly set
   - `AUTH_BASE_URL` should be `https://auth.bunch.codes/api` (note the `/api` suffix)
   - `AUTH_API_KEY` should be your actual API key
   - `AUTH_APP_ID` should be your registered app ID

2. **Test the auth service** - Visit `http://localhost:3000/api/test-auth` to test connectivity

3. **Verify the auth service is running** - The auth.bunch.codes service needs to be accessible at the URL you specified

4. **Use fallback authentication** - The app will automatically fall back to a local authentication system for testing

5. **Check the console logs** - The application logs detailed information about auth requests to help with debugging

#### Fallback Authentication

When the main auth service is unavailable, the application uses an in-memory authentication system that:
- Stores users temporarily (data is lost on server restart)
- Uses JWT tokens for session management
- Provides the same API interface as the main auth service
- Shows "(using fallback auth)" in success messages

This allows you to fully test the bookmark functionality while setting up the proper authentication service.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
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

The application uses a single `bookmarks` table with the following structure:

```sql
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  domain TEXT NOT NULL,
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
