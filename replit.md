# TaskFlow - Modern Mobile CRUD Application

## Overview

This is a Flask-based task management application with a stunning modern UI design. The app features glassmorphism effects, gradient animations, and a mobile-first approach. It provides complete CRUD operations for task management with advanced features like smart filtering, overdue detection, and beautiful visual interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 31, 2025 - Major UI/UX Redesign
- Complete visual redesign with modern glassmorphism interface
- Brand identity update to "TaskFlow" with custom logo
- Enhanced task cards with 3D hover effects and priority-based styling  
- Smart add button functionality (only shows when tasks exist)
- Gradient color schemes and smooth animations throughout
- Overdue task detection with warning animations
- Enhanced floating action button with rotation effects
- Mobile-optimized responsive design improvements

## System Architecture

The application follows a traditional three-tier architecture:

1. **Frontend**: HTML templates with Bootstrap CSS framework and vanilla JavaScript for interactivity
2. **Backend**: Flask web framework with SQLAlchemy ORM for database operations
3. **Database**: SQLite (default) with PostgreSQL support via environment configuration

The architecture prioritizes simplicity and mobile responsiveness, using server-side rendering for the main interface and AJAX API calls for dynamic operations.

## Key Components

### Backend Components

- **Flask Application (`app.py`)**: Main application factory with database initialization, CORS configuration, and proxy middleware for deployment
- **Models (`models.py`)**: SQLAlchemy model defining the Task entity with fields for title, description, status, priority, timestamps, and due dates
- **Routes (`routes.py`)**: API endpoints for task operations including GET, POST, PUT, DELETE with filtering and search capabilities
- **Main Entry Point (`main.py`)**: Application runner for development

### Frontend Components

- **Templates (`templates/index.html`)**: Modern single-page application with glassmorphism design and TaskFlow branding
- **Custom Styles (`static/css/custom.css`)**: Advanced CSS with gradient animations, 3D effects, and mobile-first responsive design
- **JavaScript Application (`static/js/app.js`)**: Enhanced client-side logic with smart UI interactions, animated transitions, and overdue detection

### Database Schema

The Task model includes:
- `id`: Primary key
- `title`: Required task title (max 200 chars)
- `description`: Optional text description
- `status`: Task status (default: 'pending')
- `priority`: Task priority (default: 'medium')
- `created_at`, `updated_at`: Automatic timestamps
- `due_date`: Optional due date

## Data Flow

1. **User Interface**: Bootstrap-based responsive interface sends AJAX requests
2. **API Layer**: Flask routes handle HTTP requests and validate data
3. **Business Logic**: Simple CRUD operations with filtering and search
4. **Data Layer**: SQLAlchemy ORM manages database interactions
5. **Database**: SQLite for development, configurable for PostgreSQL in production

The application uses a RESTful API design with JSON responses for all data operations.

## External Dependencies

### Backend Dependencies
- **Flask**: Web framework and routing
- **Flask-SQLAlchemy**: Database ORM and migrations
- **Flask-CORS**: Cross-origin resource sharing support
- **Werkzeug**: WSGI utilities and proxy middleware

### Frontend Dependencies (CDN)
- **Bootstrap 5**: UI framework with Replit dark theme as foundation
- **Font Awesome**: Comprehensive icon library for modern UI elements
- **Vanilla JavaScript**: Pure DOM manipulation with advanced animations and effects
- **CSS3**: Modern features including glassmorphism, gradients, and 3D transforms

## Deployment Strategy

The application is configured for flexible deployment:

### Development
- SQLite database for local development
- Flask development server with debug mode
- Hot reload enabled for code changes

### Production Considerations
- Environment variable configuration for database URL
- ProxyFix middleware for reverse proxy deployment
- Connection pooling with health checks
- CORS enabled for API access
- Session secret from environment variables

### Environment Configuration
- `DATABASE_URL`: Database connection string (defaults to SQLite)
- `SESSION_SECRET`: Flask session encryption key
- Logging configured at DEBUG level

The application is designed to run on platforms like Replit, Heroku, or similar cloud platforms with minimal configuration changes.