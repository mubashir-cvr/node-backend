const express = require('express');
const path = require('path');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const yamlFilePath = path.resolve(__dirname, 'swagger-doc.yaml'); // Replace with the path to your OpenAPI Specification file
const openApiSpec = YAML.load(yamlFilePath);
// Import and use auth and feed routes
const authRoutes = require('./auth');
const feedRoutes = require('./feed');

// Mount auth and feed routes
router.use('/auth', authRoutes);
router.use('/feed', feedRoutes);
router.use('', swaggerUi.serve, swaggerUi.setup(openApiSpec));


module.exports = router;