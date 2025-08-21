import { Router } from 'express';
import { z } from 'zod';
import { ContentController } from '../controllers/contentController';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const contentController = new ContentController();

/**
 * @swagger
 * components:
 *   schemas:
 *     ContentItem:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - content
 *         - url
 *         - category
 *         - source
 *         - credibility
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique content identifier
 *         title:
 *           type: string
 *           description: Content title
 *         content:
 *           type: string
 *           description: Full content text
 *         snippet:
 *           type: string
 *           description: Brief content summary
 *         url:
 *           type: string
 *           format: uri
 *           description: Content source URL
 *         category:
 *           type: string
 *           enum: [hardware-support, software-support, network-connectivity, security-compliance, general-troubleshooting]
 *         credibility:
 *           type: object
 *           properties:
 *             level:
 *               type: string
 *               enum: [official, community, questionable, unknown]
 *             score:
 *               type: number
 *               minimum: 0
 *               maximum: 100
 *             indicators:
 *               type: array
 *               items:
 *                 type: string
 *             warnings:
 *               type: array
 *               items:
 *                 type: string
 *     
 *     ContentSearchQuery:
 *       type: object
 *       properties:
 *         q:
 *           type: string
 *           description: Search query text
 *         category:
 *           type: string
 *           description: Filter by content category
 *         credibilityLevel:
 *           type: string
 *           enum: [official, community, questionable, unknown]
 *         sourceType:
 *           type: string
 *           description: Filter by source type
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         sortBy:
 *           type: string
 *           enum: [relevance, date, credibility, title]
 *           default: relevance
 *         includeRedHerrings:
 *           type: boolean
 *           default: true
 */

// Search content
const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    credibilityLevel: z.string().optional(),
    sourceType: z.string().optional(),
    tags: z.string().optional(),
    scenarioId: z.string().optional(),
    isRedHerring: z.string().optional(),
    difficulty: z.string().optional(),
    language: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    includeRedHerrings: z.string().optional(),
    scenarioContext: z.string().optional(),
  })
});

/**
 * @swagger
 * /api/v1/content/search:
 *   get:
 *     summary: Search content
 *     description: Search through curated knowledge base content with filtering and sorting
 *     tags:
 *       - Content
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query text
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by content category
 *       - in: query
 *         name: credibilityLevel
 *         schema:
 *           type: string
 *           enum: [official, community, questionable, unknown]
 *         description: Filter by credibility level
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContentItem'
 *                     totalResults:
 *                       type: integer
 *                     searchTime:
 *                       type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrevious:
 *                           type: boolean
 */
router.get('/search', validateRequest(searchQuerySchema), contentController.searchContent);

/**
 * @swagger
 * /api/v1/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     description: Retrieve specific content item by its unique identifier
 *     tags:
 *       - Content
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content unique identifier
 *     responses:
 *       200:
 *         description: Content item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ContentItem'
 *       404:
 *         description: Content not found
 */
router.get('/:id', contentController.getContentById);

/**
 * @swagger
 * /api/v1/content/scenario/{scenarioId}:
 *   get:
 *     summary: Get content by scenario
 *     description: Retrieve content items associated with a specific scenario
 *     tags:
 *       - Content
 *     parameters:
 *       - in: path
 *         name: scenarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scenario identifier
 *       - in: query
 *         name: includeRedHerrings
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include red herring content
 *     responses:
 *       200:
 *         description: Scenario content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     scenarioId:
 *                       type: string
 *                     contentCount:
 *                       type: integer
 *                     content:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContentItem'
 */
router.get('/scenario/:scenarioId', contentController.getContentByScenario);

/**
 * @swagger
 * /api/v1/content:
 *   post:
 *     summary: Create new content
 *     description: Create a new content item in the knowledge base
 *     tags:
 *       - Content
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContentItem'
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ContentItem'
 *                 message:
 *                   type: string
 */
router.post('/', contentController.createContent);

/**
 * @swagger
 * /api/v1/content/{id}:
 *   put:
 *     summary: Update content
 *     description: Update an existing content item
 *     tags:
 *       - Content
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContentItem'
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ContentItem'
 *                 message:
 *                   type: string
 *       404:
 *         description: Content not found
 */
router.put('/:id', contentController.updateContent);

/**
 * @swagger
 * /api/v1/content/{id}:
 *   delete:
 *     summary: Delete content
 *     description: Delete a content item from the knowledge base
 *     tags:
 *       - Content
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content unique identifier
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Content not found
 */
router.delete('/:id', contentController.deleteContent);

/**
 * @swagger
 * /api/v1/content/{id}/credibility:
 *   post:
 *     summary: Assess content credibility
 *     description: Perform credibility assessment on a content item
 *     tags:
 *       - Content
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content unique identifier
 *     responses:
 *       200:
 *         description: Credibility assessment result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     contentId:
 *                       type: string
 *                     level:
 *                       type: string
 *                       enum: [official, community, questionable, unknown]
 *                     score:
 *                       type: number
 *                     indicators:
 *                       type: array
 *                       items:
 *                         type: object
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post('/:id/credibility', contentController.assessCredibility);

/**
 * @swagger
 * /api/v1/content/credibility/stats:
 *   get:
 *     summary: Get credibility statistics
 *     description: Retrieve overall credibility assessment statistics
 *     tags:
 *       - Content
 *     responses:
 *       200:
 *         description: Credibility statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAssessments:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     distributionByLevel:
 *                       type: object
 */
router.get('/credibility/stats', contentController.getCredibilityStats);

/**
 * @swagger
 * /api/v1/content/credibility/explain/{level}:
 *   get:
 *     summary: Explain credibility level
 *     description: Get explanation for a specific credibility level
 *     tags:
 *       - Content
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *           enum: [official, community, questionable, unknown]
 *         description: Credibility level to explain
 *     responses:
 *       200:
 *         description: Credibility level explanation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     level:
 *                       type: string
 *                     explanation:
 *                       type: string
 */
router.get('/credibility/explain/:level', contentController.explainCredibilityLevel);

/**
 * @swagger
 * /api/v1/content/categories:
 *   get:
 *     summary: Get content categories
 *     description: Retrieve all available content categories and subcategories
 *     tags:
 *       - Content
 *     responses:
 *       200:
 *         description: Content categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                       label:
 *                         type: string
 *                       subcategories:
 *                         type: array
 */
router.get('/categories', contentController.getContentCategories);

/**
 * @swagger
 * /api/v1/content/filters:
 *   get:
 *     summary: Get available filters
 *     description: Retrieve all available filter options for content search
 *     tags:
 *       - Content
 *     responses:
 *       200:
 *         description: Available filters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                     credibilityLevels:
 *                       type: array
 *                     sourceTypes:
 *                       type: array
 */
router.get('/filters', contentController.getContentFilters);

/**
 * @swagger
 * /api/v1/content/analytics:
 *   get:
 *     summary: Get content analytics
 *     description: Retrieve analytics and statistics about content usage and effectiveness
 *     tags:
 *       - Content
 *     responses:
 *       200:
 *         description: Content analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalContent:
 *                       type: integer
 *                     totalViews:
 *                       type: integer
 *                     averageCredibilityScore:
 *                       type: number
 *                     contentByCategory:
 *                       type: array
 *                     credibilityDistribution:
 *                       type: array
 */
router.get('/analytics', contentController.getContentAnalytics);

export { router as contentRoutes };