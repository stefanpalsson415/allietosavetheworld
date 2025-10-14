# Task Weight API

A comprehensive microservice for personalized task weight calculations with advanced adaptation and learning capabilities.

## Overview

The Task Weight API provides sophisticated calculation, storage, learning, and personalization for family task weights. It serves as a foundation for the family balance personalization platform, enabling weights to adapt based on a family's unique circumstances, cultural context, relationship dynamics, and life stages.

## Core Features

- **Advanced Weight Calculation**: Comprehensive base weight calculation with multiple factors
- **Version Management**: Support for multiple calculation algorithm versions and version control
- **Family Profiles**: Personalized weight adjustments based on family characteristics
- **Dynamic Weight Evolution**: Adaptive weights that learn from feedback and patterns
- **Enhanced Personalization**: Context-aware weight adjustments based on multiple factors
- **Integrated Insights**: Combined analysis across all personalization systems
- **RESTful API**: Clean interface for integration with other services

## Personalization Systems

The API includes several advanced personalization systems:

### Dynamic Weight Evolution
Enables weights to learn and adapt over time based on feedback, patterns, and effectiveness data.

### Burnout Prevention Intelligence
Detects burnout risk patterns and provides targeted interventions to prevent parent burnout.

### Life Stage Adaptation
Automatically adjusts weights based on children's life stages and family transitions.

### Cultural Contextualization
Respects diverse cultural backgrounds by adapting weights to different cultural expectations.

### Relationship Style Integration
Customizes weights based on relationship dynamics and communication patterns.

## Architecture

The service consists of several core modules:

- **Weight Calculator**: Performs the base task weight calculations
- **Version Manager**: Manages different calculation algorithm versions
- **Family Profiler**: Handles family-specific weight customization
- **Data Storage**: Manages persistence of calculation data
- **Weight Evolution**: Enables weights to learn and adapt over time
- **Burnout Prevention**: Detects and mitigates burnout risk
- **Life Stage Adapter**: Adapts weights based on children's development stages
- **Cultural Context**: Adjusts weights based on cultural background
- **Relationship Style**: Customizes weights based on relationship dynamics
- **Scheduled Jobs**: Automatic processing of feedback and weight adjustments

## API Endpoints

### Enhanced Weight Calculation

- `POST /calculate`: Calculate base weight for a single task
- `POST /calculate/enhanced`: Calculate fully personalized weight for a single task
- `POST /calculate/batch`: Calculate base weights for multiple tasks
- `POST /calculate/enhanced/batch`: Calculate personalized weights for multiple tasks
- `POST /calculate/balance`: Calculate survey balance based on responses

### Family Insights

- `GET /family/:familyId/profile`: Get family-specific weight profile
- `GET /family/:familyId/insights`: Get comprehensive family insights across all systems
- `PUT /family/:familyId/adjustments`: Update family-specific weight adjustments

### Burnout Prevention

- `POST /burnout/assess/:familyId`: Assess burnout risk for a family
- `GET /burnout/latest/:familyId`: Get latest burnout assessment for a family
- `GET /burnout/history/:familyId`: Get burnout assessment history
- `POST /burnout/intervention/track`: Track intervention implementation
- `GET /burnout/intervention/effectiveness`: Analyze intervention effectiveness (admin)
- `GET /burnout/alert/:familyId`: Check for burnout alert for a family

### Life Stage Adaptation

- `POST /lifestage/analyze/:familyId`: Analyze life stages for a family
- `GET /lifestage/latest/:familyId`: Get latest life stage analysis
- `GET /lifestage/recommendations/:familyId`: Get content recommendations based on life stages

### Cultural Context

- `POST /culture/analyze/:familyId`: Analyze cultural context for a family
- `GET /culture/latest/:familyId`: Get latest cultural context analysis
- `GET /culture/suggestions/:familyId/:topic`: Get cultural suggestions for a specific topic

### Relationship Style

- `POST /relationship/analyze/:familyId`: Analyze relationship style for a family
- `GET /relationship/latest/:familyId`: Get latest relationship style analysis
- `GET /relationship/recommendations/:familyId`: Get recommendations based on relationship style

### Weight Evolution

- `POST /evolution/process-feedback`: Process pending weight feedback (admin)
- `GET /evolution/profile-correlations`: Analyze profile correlations (admin)
- `POST /evolution/cycle`: Run a full weight evolution cycle (admin)
- `GET /evolution/task/:taskId`: Get task evolution history
- `GET /evolution/family/:familyId`: Get family-specific weight evolution

### History and Versions

- `GET /history/:taskId`: Get task weight calculation history
- `GET /versions`: Get available calculator versions

### Feedback

- `POST /feedback`: Submit feedback for task weights

## Enhanced Weight Calculation

The enhanced weight calculation provides personalized task weights by incorporating multiple adaptation systems:

1. **Base Weight**: Calculated using the core algorithm with fundamental factors
2. **Life Stage Adaptation**: Adjusts weights based on family's current life stages
3. **Cultural Context**: Adapts weights based on cultural background and values
4. **Relationship Style**: Customizes weights based on relationship dynamics
5. **Weight Evolution**: Further refines weights based on feedback learning

The result includes detailed information about each adaptation applied, enabling transparency in the weight calculation process.

## Comprehensive Family Insights

The `/family/:familyId/insights` endpoint provides a complete analysis of a family across all systems:

- **Burnout Risk Assessment**: Current burnout risk level and intervention recommendations
- **Life Stage Analysis**: Children's life stages and active transitions
- **Cultural Context Insights**: Cultural background influences on task distribution
- **Relationship Style Analysis**: Relationship dynamics and communication patterns
- **Priority Recommendations**: Cross-system prioritized recommendations

This unified view enables a holistic understanding of each family's unique context.

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and configure:
   ```
   cp .env.example .env
   ```
4. Start the server:
   ```
   npm start
   ```

## Development

```
npm run dev        # Start API server with hot reload
npm run start:cron # Start the cron job service
npm test           # Run tests
```

## Deployment

The service can be deployed in various ways:

1. **Standalone Node.js Service**: Deploy directly on a server or container
2. **Firebase Cloud Functions**: Deploy as a set of cloud functions
3. **Kubernetes**: Deploy as containerized microservices

For Firebase deployment, use:
```
firebase deploy --only functions:taskWeightApi
```

## Security

- Admin endpoints are secured with API key authentication
- Family-specific endpoints verify family access rights
- All data is stored securely in Firestore

## Integration with Allie Chat

This API is designed to integrate seamlessly with the Allie Chat system, providing rich insights that enable proactive support such as:

- Burnout prevention alerts when risk is detected
- Life stage transition guidance at critical moments
- Culturally appropriate recommendations
- Relationship-specific workload suggestions

The comprehensive family insights endpoint provides Allie with the context needed to proactively support families.