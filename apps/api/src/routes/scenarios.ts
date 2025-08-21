import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { createValidationChain, sanitizeInput } from '../middleware/validation';
import { ScenarioController } from '../controllers/scenarioController';

const router = Router();
const scenarioController = new ScenarioController();

// Get all scenarios
router.get('/', 
  authMiddleware,
  scenarioController.getAllScenarios.bind(scenarioController)
);

// Get scenario by ID
router.get('/:id', 
  authMiddleware,
  createValidationChain([
    param('id')
      .isUUID()
      .withMessage('Scenario ID must be a valid UUID')
      .customSanitizer(sanitizeInput),
  ]),
  scenarioController.getScenarioById.bind(scenarioController)
);

// Start a scenario
router.post('/:id/start', 
  authMiddleware,
  createValidationChain([
    param('id')
      .isUUID()
      .withMessage('Scenario ID must be a valid UUID')
      .customSanitizer(sanitizeInput),
  ]),
  scenarioController.startScenario.bind(scenarioController)
);

// Get scenarios by difficulty
router.get('/difficulty/:level', 
  authMiddleware,
  createValidationChain([
    param('level')
      .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
      .withMessage('Difficulty level must be BEGINNER, INTERMEDIATE, or ADVANCED')
      .customSanitizer(sanitizeInput),
  ]),
  scenarioController.getScenariosByDifficulty.bind(scenarioController)
);

// Get user's scenario progress
router.get('/progress/me', 
  authMiddleware,
  scenarioController.getUserScenarioProgress.bind(scenarioController)
);

export default router;