import { Request, Response } from 'express';
export declare class CompetitorController {
    static getCompetitors(req: Request, res: Response): Promise<void>;
    static getCompetitor(req: Request, res: Response): Promise<void>;
    static createCompetitor(req: Request, res: Response): Promise<void>;
    static updateCompetitor(req: Request, res: Response): Promise<void>;
    static deleteCompetitor(req: Request, res: Response): Promise<void>;
    static addPrice(req: Request, res: Response): Promise<void>;
    static getPriceComparison(req: Request, res: Response): Promise<void>;
    static getPriceHistory(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=competitorController.d.ts.map