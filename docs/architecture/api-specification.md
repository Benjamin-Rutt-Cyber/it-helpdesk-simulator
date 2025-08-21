# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: IT Helpdesk Simulator API
  version: 1.0.0
  description: Comprehensive API for IT Helpdesk Simulator platform
servers:
  - url: https://api.helpdesksimu.com/v1
    description: Production API
  - url: https://staging-api.helpdesksimu.com/v1
    description: Staging API

paths:
  /auth/login:
    post:
      summary: User authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string
                  expiresAt:
                    type: string
                    format: date-time

  /scenarios:
    get:
      summary: Get available scenarios
      parameters:
        - name: difficulty
          in: query
          schema:
            type: string
            enum: [starter, intermediate, advanced]
        - name: completed
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: List of scenarios
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Scenario'

  /scenarios/{scenarioId}/start:
    post:
      summary: Start a new scenario session
      parameters:
        - name: scenarioId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '201':
          description: Session created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserSession'

  /sessions/{sessionId}/messages:
    post:
      summary: Send message in chat session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  maxLength: 1000
                messageType:
                  type: string
                  enum: [user, system, verification]
      responses:
        '201':
          description: Message sent
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatMessage'

  /sessions/{sessionId}/resolve:
    post:
      summary: Resolve or escalate session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                resolutionType:
                  type: string
                  enum: [resolved, escalated]
                documentation:
                  type: string
                  maxLength: 2000
                escalationReason:
                  type: string
                  maxLength: 500
      responses:
        '200':
          description: Session resolved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SessionResolution'

  /users/me/performance:
    get:
      summary: Get user performance metrics
      parameters:
        - name: timeframe
          in: query
          schema:
            type: string
            enum: [week, month, all]
        - name: dimension
          in: query
          schema:
            type: string
            enum: [technical, communication, verification, efficiency]
      responses:
        '200':
          description: Performance metrics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PerformanceMetrics'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        profile:
          $ref: '#/components/schemas/UserProfile'
        level:
          type: integer
          minimum: 1
        xp:
          type: integer
          minimum: 0
        createdAt:
          type: string
          format: date-time

    Scenario:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        difficulty:
          type: string
          enum: [starter, intermediate, advanced]
        estimatedTime:
          type: integer
        xpReward:
          type: integer
        prerequisites:
          type: array
          items:
            type: string
            format: uuid

    UserSession:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        scenarioId:
          type: string
          format: uuid
        status:
          type: string
          enum: [active, completed, abandoned]
        startedAt:
          type: string
          format: date-time
        completedAt:
          type: string
          format: date-time
        performanceData:
          $ref: '#/components/schemas/PerformanceData'
```
