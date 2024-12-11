// Purpose: Middleware to handle async functions in express.
const asyncMiddleware = (middleware: any) => (req: any, res: any, next: any) => {
    Promise.resolve(middleware(req, res, next)).catch(next);
};

export default asyncMiddleware;