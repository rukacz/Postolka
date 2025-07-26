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
- **Storage**: PostgreSQL database with Drizzle ORM
- **Database**: Neon PostgreSQL with automatic seeding
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

### Recent Changes
- **2025-01-26**: Complete change notification and field-level visualization system
  - Implemented comprehensive change tracking with color-coded dots (red for time changes, orange for other changes)
  - Added "Changes" filter to dashboard with options: All, Only with changes, Only acknowledged
  - Enhanced database schema with change tracking fields for both BL summaries and containers
  - Added "Acknowledge Changes" button in booking details with proper API endpoint
  - Implemented field-level change highlighting with yellow background and 📝 emoji indicators
  - Enhanced ContainerTable with field-level change visualization for all container fields
  - Created sample data with realistic change scenarios for comprehensive testing
- **2025-01-22**: Major UI restructure and New Order component
  - Removed Priority column, added Carrier Status and Medlog Status columns  
  - Created CarrierStatusBadge, MedlogStatusBadge, and TrainStatusIcon components
  - Updated database schema with carrierStatus, medlogStatus, trainScheduled fields
  - Built comprehensive New Order form with dynamic Import/Export functionality
  - Added ISO 6346 container number validation and accordion-based container management
  - Implemented "Load from MSC" button with simulated API integration
  - All UI text converted to English as per user preference
- **2025-01-20**: Added PostgreSQL database integration
  - Replaced in-memory storage with Neon PostgreSQL
  - Implemented DatabaseStorage class with full CRUD operations
  - Added automatic database seeding with sample BL and container data
  - Updated container schema with containerType and transporter fields
  - Modified BL detail layout: Delivery Information moved to left column

### Development vs Production
- **Development**: Vite dev server with HMR, PostgreSQL database with seeding
- **Production**: Express serves static files, PostgreSQL database
- **Replit Integration**: Special handling for Replit development environment

The architecture supports easy scaling and can be deployed to any cloud provider supporting Node.js and PostgreSQL.