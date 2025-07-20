# Replit.md - Poštolka Logistics Management Platform

## Overview

Poštolka is a modern logistics management web application built to replace legacy Power Apps for container transport management. The system serves 200 internal users (MSC Agents & Medlog CUS) and focuses on efficient BL (Bill of Lading) and container shipment management with real-time tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack TypeScript architecture with a clear separation between client and server components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Storage**: In-memory storage with interface for future database integration
- **Development**: Hot-reload with Vite integration in development mode

## Key Components

### Database Schema (PostgreSQL Ready)
The application uses Drizzle ORM with PostgreSQL dialect for future database integration:

- **bl_summaries**: Main table for BL overview data (id, blNumber, date, client, consignee, destination, status, priority, etc.)
- **bl_details**: Detailed BL information (customer info, vessel details, delivery information)
- **containers**: Container-specific data linked to BL numbers
- **users**: User management (prepared for authentication)

### Core Features
1. **Dashboard**: Main BL list view with advanced filtering and search
2. **BL Detail View**: Comprehensive single BL information screen
3. **Container Management**: Container tracking with route visualization
4. **Real-time Updates**: Change tracking with "hasChanges" indicators
5. **Advanced Filtering**: Multi-criteria search and filter system

### UI Components
- **BLTable**: Main data table with sorting, selection, and row actions
- **FilterBar**: Advanced filtering interface with expandable options
- **NavigationHeader**: Global search and user management
- **ContainerTable**: Container-specific data display with route tracking
- **StatusBadge**: Dynamic status indicators with color coding
- **PriorityIndicator**: Visual priority system (high/medium/low)

## Data Flow

1. **Client requests** → React Query → API endpoints
2. **Server processing** → Storage layer (currently in-memory) → Response
3. **Real-time updates** → Change tracking → UI indicators
4. **Filter/search** → Client-side processing → Table updates

The application implements optimistic updates and caching through React Query, with automatic invalidation on data mutations.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection ready for deployment
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Backend web framework
- **wouter**: Lightweight React routing

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **date-fns**: Date manipulation utilities

## Deployment Strategy

The application is designed for containerized deployment with:

### Production Build
- **Frontend**: Static assets built with Vite to `dist/public`
- **Backend**: Bundle server code with esbuild to `dist/index.js`
- **Database**: PostgreSQL with Drizzle migrations in `migrations/` directory

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- Session management ready with `connect-pg-simple`

### Development vs Production
- **Development**: Vite dev server with HMR, in-memory storage
- **Production**: Express serves static files, PostgreSQL database
- **Replit Integration**: Special handling for Replit development environment

The architecture supports easy scaling and can be deployed to any cloud provider supporting Node.js and PostgreSQL.