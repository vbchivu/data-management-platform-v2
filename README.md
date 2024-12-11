
# Virtual and Physical Database Management API

## Overview
This platform allows users to manage virtual and physical databases, including collections/tables and records. It provides endpoints for user authentication, database creation, collection management, and record operations while supporting connections to both the application database and external physical databases.

## **Key Features**
- **Database Management**:
  - Full CRUD support for physical MongoDB and MySQL databases.
  - Virtual databases stored in application databases for MongoDB and MySQL.
- **Collections/Tables**:
  - Manage collections (MongoDB) and tables (MySQL) with custom schemas and validation.
- **Records**:
  - Perform CRUD operations with schema validation.
- **Security**:
  - Role-based access control ensures data isolation and user-specific access.
- **Synchronization**:
  - Metadata is synchronized between the application database and virtual databases for consistency.
- **API Documentation**:
  - Swagger for easy API exploration and testing.
- **Logging**:
  - Integrated logging using Winston and Morgan for detailed activity tracking.
- **Centralized Connection Management**:
  - Efficiently manages database connections using a custom `DatabaseConnectionManager`.

## Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT
- **Documentation**: Swagger and Swagger UI
- **Logging**: Winston, Morgan
- **Deployment**: Local server or cloud environments

## Prerequisites
- **Node.js**: Version 14 or above.
- **MongoDB**: A running instance of MongoDB.
- **NPM/Yarn**: To manage dependencies.

## Installation

### Clone the repository:
```bash
git clone https://github.com/vbchivu/data-management-platform-v2.git
cd data-management-platform-v2
```

### Install dependencies:
```bash
npm install
```

### Create a `.env` file in the root directory following the .env.example file

### Run the application:
```bash
npm start
```

### Access API documentation:
- **Swagger UI**: [http://localhost:5000/docs](http://localhost:5000/docs)


## Authentication and Authorization
All protected routes require an `Authorization` header with a valid JWT token in the format:
```plaintext
Authorization: Bearer <token>
```

### Bearer Token in Swagger
- Swagger UI provides an "Authorize" button to input your JWT token for API testing.
- After logging in using `/auth/login`, copy the token and paste it in the Swagger UI Authorize section.

## Logger

### Winston
- **Info**: General application information such as successful API calls.
- **Warn**: Warnings, such as when retrying failed database connections.
- **Error**: Errors, such as failed API requests or database issues.

### Morgan
Morgan middleware is used to log HTTP requests in a simplified format.

## Middleware
- **Helmet**: Adds security headers.
- **Passport**: Initializes for JWT handling.
- **authenticateJWT**: Verifies the JWT token for secured routes.
- **validateAndAuthorizeDatabaseAccess**: Middleware for database access control based on user roles and ownership.
- **dbConnectionMiddleware**: Ensures the main application database is connected before processing requests.

## Error Handling
- **400**: Bad request (e.g., missing required parameters).
- **401**: Unauthorized (e.g., invalid token).
- **404**: Not found (e.g., database, collection, or record not found).
- **500**: Internal server error (e.g., database connection issues).

## Deployment

### Running Locally
Ensure you have MongoDB running on your machine or a remote instance that the application can connect to.

### Environment Variables
To deploy, adjust the `.env` file with production credentials:
- Set `NODE_ENV=production`.
- Replace `MONGO_APP_URI` and `MONGO_PHYSICAL_DB_URI_TEMPLATE` with production database URIs.

## Project Structure
```
├── src
│   ├── app
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   └── services
│   ├── config
│   ├── public
│   ├── index.ts
│   └── swagger.yaml
├── .env
├── package.json
└── README.md
```

- **Controllers**: Manage incoming requests and call services to process logic.
- **Middleware**: Handle JWT authentication, logging, etc.
- **Models**: Define data schemas for MongoDB and MySQL
- **Routes**: Define API paths.
- **Services**: Business logic and database interaction.
- **Swagger.yaml**: API documentation configuration.

## How to Contribute
1. Fork the repository.
2. Create a new branch (`feature/your-feature-name`).
3. Make changes and commit them.
4. Push to your branch.
5. Create a pull request.

## License
This project is licensed under the MIT License.

## Contact
For any inquiries or suggestions, please reach out to the project owner or open an issue on GitHub.
