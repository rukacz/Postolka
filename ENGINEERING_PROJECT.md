# Engineering Project Documentation
## Poštolka Logistics Management Platform

### Project Overview

**Project Name**: Poštolka - Modern Logistics Management Platform  
**Target Users**: 200 internal users (MSC Agents & Medlog CUS)  
**Purpose**: Replace legacy Power Apps with a modern web-based container transport management system  
**Development Timeline**: January 2025 - Ongoing  

### Business Context

#### Problem Statement
- Legacy Power Apps system limited scalability and user experience
- Manual container tracking processes prone to errors
- Lack of real-time visibility into shipment status
- Inefficient Bill of Lading (BL) management workflows
- Limited filtering and search capabilities

#### Solution Goals
- Streamline container shipment processes
- Provide real-time tracking capabilities
- Advanced filtering and search functionality
- Improved user interface with modern web technologies
- Scalable architecture for future growth

### Technical Architecture

#### Technology Stack
**Frontend**
- React 18 with TypeScript
- Wouter for client-side routing
- TanStack React Query for state management
- Shadcn/ui with Radix UI primitives
- Tailwind CSS for styling
- Vite for build tooling

**Backend**
- Node.js with Express.js
- TypeScript with ES modules
- RESTful API architecture
- PostgreSQL with Drizzle ORM
- Neon PostgreSQL cloud database

**Development Environment**
- Replit development platform
- Hot-reload with Vite integration
- Automated database seeding

#### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express API    │────│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │Shadcn/UI│             │Drizzle  │             │ Neon    │
    │Tailwind │             │   ORM   │             │Postgres │
    └─────────┘             └─────────┘             └─────────┘
```

### Database Schema Design

#### Core Entities
1. **bl_summaries** - Main BL overview data
   - Primary fields: id, blNumber, date, client, consignee, destination, status, priority
   - Status tracking: carrierStatus, medlogStatus, trainScheduled
   - Change indicators: hasChanges field

2. **bl_details** - Detailed BL information
   - Customer and contact information
   - Vessel details and shipping information
   - Delivery and logistics data

3. **containers** - Container-specific tracking
   - Container numbers with ISO 6346 validation
   - Route and destination information
   - Dangerous cargo flags
   - Train scheduling data

4. **users** - User management system
   - Authentication and authorization ready

#### Data Relationships
```sql
bl_summaries (1) ←→ (1) bl_details
bl_summaries (1) ←→ (n) containers
```

### Core Features Implementation

#### 1. Dashboard & BL Management
- **BL Table Component**: Sortable data table with row selection
- **Advanced Filtering**: Multi-criteria search with 4 filter types:
  - DG (Dangerous Goods)
  - Changed Only
  - New Train
  - Delivery not possible
- **Status Management**: Carrier status, Medlog status, and train scheduling

#### 2. Container Management
- **Container Tracking**: Individual container cards with route visualization
- **Train Logic**: Intelligent train icon system:
  - Red: Impossible delivery (train departure after delivery date)
  - Green: Scheduled trains with possible delivery
  - Gray: No train scheduled
  - Export orders: Show "—" instead of train icons

#### 3. Order Management System
- **New Order Form**: Dynamic Import/Export functionality
- **Export Order Features**:
  - Non-mandatory fields: Customs Documents, VGM requested, BTH/ZAPP/TCC Request, Goods in Transit
  - Default null values displayed as "—"
  - Customs clearance options: Melnik, Mosnov, Obrnice, Bratislava
- **Container Validation**: ISO 6346 standard compliance

#### 4. Real-time Features
- **Change Tracking**: "hasChanges" indicators for booking modifications
- **Chat Integration**: Unread message indicators and preview
- **Status Updates**: Real-time carrier and logistics status

### API Design

#### RESTful Endpoints
```
GET    /api/bl-summaries          # List all BL summaries
GET    /api/bl-summaries/:id      # Get specific BL summary
GET    /api/bl-details/:blNumber  # Get BL details
GET    /api/containers            # List all containers
GET    /api/containers/:blNumber  # Get containers for specific BL
POST   /api/bl-summaries          # Create new BL
PUT    /api/bl-summaries/:id      # Update BL summary
```

#### Data Validation
- Zod schemas for type-safe validation
- ISO 6346 container number validation
- Business rule enforcement at API level

### Development Workflow

#### Version Control & Deployment
- Git-based version control
- Replit environment for development
- Database migrations via Drizzle ORM
- `npm run db:push` for schema updates

#### Code Standards
- TypeScript strict mode
- ESLint and Prettier configuration
- Component-based architecture
- Separation of concerns (client/server/shared)

#### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Manual testing for UI components
- Database transaction testing

### Performance Considerations

#### Frontend Optimization
- React Query for efficient caching
- Optimistic updates for better UX
- Lazy loading for large datasets
- Debounced search and filtering

#### Backend Optimization
- Database indexing on frequently queried fields
- Connection pooling for PostgreSQL
- API response caching where appropriate

#### Scalability Features
- Modular component architecture
- Stateless API design
- Database normalization
- Prepared for horizontal scaling

### Security Implementation

#### Data Protection
- Environment-based configuration
- Database connection security
- Input validation and sanitization
- SQL injection prevention via ORM

#### User Management
- Session-based authentication ready
- Role-based access control prepared
- Secure password handling

### Deployment Architecture

#### Production Setup
```
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
┌────────▼────────┐    ┌─────────────────┐
│  Express Server │────│  PostgreSQL DB  │
│   (Node.js)     │    │     (Neon)      │
└─────────────────┘    └─────────────────┘
```

#### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode
- Session management with `connect-pg-simple`

### Recent Technical Achievements

#### January 2025 Milestones
- ✅ PostgreSQL database integration
- ✅ Advanced filtering system implementation
- ✅ Train status logic with delivery feasibility
- ✅ Export order form optimization
- ✅ Container-level dangerous cargo management
- ✅ Change notification system

#### Current Development Status
- Core functionality: 95% complete
- UI/UX refinements: Ongoing
- Advanced features: In development
- Testing and optimization: In progress

### Future Roadmap

#### Phase 1 (Q1 2025)
- Complete chat functionality
- Enhanced reporting features
- Mobile responsiveness improvements

#### Phase 2 (Q2 2025)
- Advanced analytics dashboard
- Integration with external logistics APIs
- Automated notifications system

#### Phase 3 (Q3 2025)
- Machine learning for route optimization
- Advanced workflow automation
- Real-time collaboration features

### Technical Metrics

#### Performance Targets
- Page load time: < 2 seconds
- API response time: < 500ms
- Database query time: < 100ms
- User interface responsiveness: < 100ms

#### Scalability Targets
- Support for 500+ concurrent users
- Handle 10,000+ containers simultaneously
- 99.9% uptime availability
- Horizontal scaling capability

### Conclusion

The Poštolka platform represents a significant modernization of logistics management processes, leveraging cutting-edge web technologies to deliver a scalable, user-friendly solution. The architecture prioritizes performance, maintainability, and future extensibility while addressing immediate business needs for container transport management.

---
**Document Version**: 1.0  
**Last Updated**: January 29, 2025  
**Prepared by**: Development Team  
**Review Status**: Current  