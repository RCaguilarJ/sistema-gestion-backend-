# Copilot Instructions for Sistema de Gestión Médica Backend

## Project Overview
This is a Node.js/Express backend API for a medical management system (Sistema de Gestión Médica) that handles patient records, appointments, consultations, nutrition plans, and user management for a healthcare facility.

## Technology Stack
- **Runtime**: Node.js with ES6 modules (`"type": "module"` in package.json)
- **Framework**: Express.js 4.x
- **Database**: MySQL with Sequelize ORM 6.x
- **Authentication**: JWT (jsonwebtoken) with bcryptjs for password hashing
- **File Upload**: Multer for handling file uploads
- **Excel Processing**: xlsx library for Excel file handling
- **CORS**: Configured for multiple development ports (5173, 5174, 3000)

## Code Style and Conventions

### General Rules
- Use ES6+ syntax with import/export statements (not require/module.exports)
- Use arrow functions for callbacks and inline functions
- Use async/await for asynchronous operations (preferred over .then/.catch)
- Use Spanish for business domain terms (e.g., `paciente`, `consulta`, `nutriólogo`)
- Use camelCase for variable and function names
- Use PascalCase for model names and classes

### File Organization
```
src/
├── config/          # Database and configuration files
├── controllers/     # Request handlers and business logic
├── middleware/      # Express middleware (auth, validation, etc.)
├── models/          # Sequelize models
├── routes/          # Express route definitions
└── utils/           # Utility functions and helpers
```

### Import Statements
- Always use `.js` extension in import statements
- Use relative paths: `../models/index.js`, `../config/database.js`
- Import from models through `index.js`: `import db from '../models/index.js'`

## Database Patterns (Sequelize ORM)

### Model Definition
- Use factory functions (models that export a function accepting `sequelize`) when the model needs to be initialized in a specific order or has complex initialization logic
- Most models use direct definition pattern for simplicity
- **Best Practice**: Specify `tableName` explicitly to control the exact table name and prevent Sequelize's auto-pluralization (some existing models may not follow this yet)
- Include `timestamps: true` explicitly for clarity when the model uses createdAt/updatedAt fields (this is Sequelize's default behavior)

Example factory pattern (used by User model):
```javascript
export default (sequelize) => {
  const User = sequelize.define('User', {
    // ... fields
  }, {
    tableName: 'users',
    timestamps: true
  });
  return User;
};
```

Example direct definition (standard pattern for new models):
```javascript
const Paciente = sequelize.define('Paciente', {
  // ... fields
}, {
  tableName: 'pacientes', // Recommended: specify to avoid auto-pluralization
  timestamps: true
});
export default Paciente;
```

**Note**: Some existing models may omit `tableName`, relying on Sequelize's default pluralization. For new models, always specify it explicitly.

### Field Definitions
- Use DataTypes from Sequelize: `DataTypes.STRING`, `DataTypes.INTEGER`, etc.
- Use ENUM for restricted values: `DataTypes.ENUM('Activo', 'Inactivo')`
- Use DECIMAL for precise numbers: `DataTypes.DECIMAL(5, 1)` for weight, `DataTypes.DECIMAL(3, 2)` for height in meters
- Use DATEONLY for dates without time: `fechaNacimiento`, `fechaDiagnostico`
- Use DATE for timestamps: `ultimaVisita`

### Model Relationships
- Define relationships in `src/models/index.js`
- Use meaningful aliases with `as` option: `{ as: 'PacientesAsignados' }`, `{ as: 'Nutriologo' }`
- Follow the pattern: `User.hasMany(Paciente, ...)` and `Paciente.belongsTo(User, ...)`

## API Structure and Routing

### Route Files
- Create route files in `src/routes/` with suffix `Routes.js` (e.g., `authRoutes.js`, `pacienteRoutes.js`)
- Export default router: `export default router;`
- Import and use in `server.js` with `/api/` prefix

### Controller Functions
- Create controller files in `src/controllers/` with suffix `Controller.js`
- Export named functions: `export const login = async (req, res) => { ... }`
- Always use try-catch blocks for error handling
- Return appropriate HTTP status codes:
  - 200 for successful GET/PUT
  - 201 for successful POST (creation)
  - 400 for bad request/validation errors
  - 401 for authentication errors
  - 403 for authorization errors
  - 404 for not found
  - 500 for server errors

### Error Response Pattern
```javascript
try {
  // ... logic
} catch (error) {
  console.error("Error description:", error);
  res.status(500).json({ 
    message: 'Error message in Spanish',
    error: error.message 
  });
}
```

## Authentication and Security

### JWT Authentication
- Secret key stored in `process.env.JWT_SECRET` with fallback for development
- Token expiration: 8 hours (`expiresIn: '8h'`)
- Token payload includes: `id`, `role`
- Authorization header format: `Bearer <token>`

### Middleware
- Use `authenticate` middleware to verify JWT tokens
- Use `authorizeRoles(...roles)` middleware to check user permissions
- Middleware is case-insensitive for role comparison

### Password Security
- Always hash passwords with bcryptjs before storing
- Use `bcrypt.compare()` to verify passwords during login
- Never send password field in API responses

### User Roles
Available roles (ENUM): `'Administrador'`, `'Doctor'`, `'Nutriólogo'`, `'Psicólogo'`, `'Paciente'`

## Environment Variables
Required environment variables (defined in `.env`):
- `DB_NAME` - MySQL database name
- `DB_USER` - MySQL username
- `DB_PASS` - MySQL password
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port (default: 3306)
- `JWT_SECRET` - Secret key for JWT signing
- `PORT` - Server port (default: 4000)

## Development Workflow

### NPM Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed admin user
- `npm run setup:db` - Setup database

### Database Timezone
- Configured for Central Time with fixed offset (GMT-6): `timezone: '-06:00'`
- Note: This uses a fixed offset and does not automatically adjust for daylight saving time
- Database logging is disabled: `logging: false`

### File Uploads
- Upload directory: `./uploads` (created automatically if not exists)
- Served statically at `/uploads` endpoint
- Use multer for handling multipart/form-data

## Common Patterns

### Fetching User with Role
```javascript
const User = db.User;
const user = await User.findOne({ where: { email } });
```

### Creating Records
```javascript
const nuevoPaciente = await Paciente.create({
  nombre,
  curp,
  // ... other fields
});
res.status(201).json({ message: 'Paciente creado exitosamente', paciente: nuevoPaciente });
```

### Updating Records
```javascript
await paciente.update({
  nombre: req.body.nombre,
  // ... other fields
});
res.json({ message: 'Paciente actualizado', paciente });
```

### Querying with Filters
```javascript
const pacientes = await Paciente.findAll({
  where: { estatus: 'Activo', nutriologoId: userId },
  order: [['createdAt', 'DESC']]
});
```

## Important Notes
- The project uses Spanish for all business domain terms and user-facing messages
- Database connections use MySQL dialect with Sequelize
- CORS is pre-configured for multiple local development ports
- The server serves static files from `dist/` directory for production frontend
- All API routes are prefixed with `/api/`
- Use console.error for error logging (no formal logging library configured)
- BMI calculation uses height in meters: `DECIMAL(3, 2)`
- Weight is stored in kilograms: `DECIMAL(5, 1)`

## Testing
- No formal testing framework is currently configured
- Manual testing is performed through API endpoints using tools like Postman or curl
- When adding test infrastructure, consider Jest or Mocha as they are popular in the Node.js ecosystem
- For new features, test manually by:
  - Making API requests to verify responses and status codes
  - Checking database state after operations
  - Testing authentication and authorization flows
  - Validating error handling with invalid inputs

## Code Quality
- Avoid adding comments unless necessary for complex logic (e.g., non-obvious algorithms, business rule explanations, or workarounds)
- Keep functions focused and single-purpose
- Use meaningful variable names in Spanish for domain concepts (e.g., `paciente`, `consulta`, `nutriologo`, `fechaNacimiento`)
- Handle edge cases and null values appropriately
- Always validate required fields before database operations
