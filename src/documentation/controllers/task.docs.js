/**
 * @swagger
 * tags:
 *   name: Task
 *   description: Task tracker management endpoints
 */

/**
 * @swagger
 * /api/task/add:
 *   post:
 *     summary: Add a new task
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Task attachment
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignee_id:
 *                 type: integer
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/task/all-task:
 *   get:
 *     summary: Get all tasks
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 */
