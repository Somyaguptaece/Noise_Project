import { retrievalService } from '../services/retrievalService.js';

export class KnowledgeController {
  static async list(req, res, next) {
    try {
      const { search = '', category = '' } = req.query;
      const documents = await retrievalService.getAllDocuments(search, category || null);
      res.json({
        success: true,
        data: {
          documents,
          total: documents.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const doc = await retrievalService.getDocumentById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, error: { message: 'Document not found' } });
      }
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }
}
