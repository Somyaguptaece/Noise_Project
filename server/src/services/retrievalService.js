import { PrismaClient } from '@prisma/client';
import { TFIDFIndex } from '../utils/tfidf.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export class RetrievalService {
  constructor() {
    this.index = null;
    this.cachedDocs = [];
    this.lastIndexedAt = null;
  }

  async ensureIndex() {
    // Reindex if not loaded or if cache older than 10 minutes
    const now = Date.now();
    if (this.index && this.lastIndexedAt && (now - this.lastIndexedAt < 10 * 60 * 1000)) {
      return this.index;
    }

    try {
      const documents = await prisma.policyDocument.findMany();
      this.cachedDocs = documents;

      const indexedDocs = documents.map(doc => ({
        id: doc.id,
        text: `${doc.title} ${doc.tags} ${doc.content}`,
        metadata: {
          title: doc.title,
          category: doc.category,
          tags: doc.tags,
          version: doc.version,
          isDemoOnly: doc.isDemoOnly,
          metadataJson: doc.metadataJson,
          rawContent: doc.content
        }
      }));

      this.index = new TFIDFIndex(indexedDocs);
      this.lastIndexedAt = now;
      logger.info(`Policy & KB TF-IDF Index refreshed with ${documents.length} documents.`);
      return this.index;
    } catch (err) {
      logger.error('Failed to build policy retrieval index:', err);
      throw err;
    }
  }

  async retrieveRelevantPolicies(queryText, categoryHint = null, topK = 4) {
    const index = await this.ensureIndex();
    const scoredResults = index.scoreQuery(queryText, categoryHint);

    const evidenceItems = scoredResults.slice(0, topK).map(res => {
      const doc = res.document.metadata;
      // Extract a focused excerpt (first 2-3 lines or sentences)
      const excerpt = doc.rawContent
        .split('\n')
        .filter(line => line.trim().length > 0 && !line.includes('DEMO POLICY ONLY'))
        .slice(0, 3)
        .join(' ')
        .substring(0, 280) + '...';

      return {
        sourceType: res.document.id.startsWith('KB') ? 'KNOWLEDGE_BASE' : 'POLICY',
        sourceId: res.document.id,
        sourceTitle: doc.title,
        excerpt,
        relevanceScore: res.score,
        explanation: `Matches customer query terms with lexical TF-IDF relevance score ${res.score}${categoryHint ? ` and category boost [${categoryHint}]` : ''}.`
      };
    });

    return evidenceItems;
  }

  async getAllDocuments(search = '', category = null) {
    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tags: { contains: search } },
        { content: { contains: search } }
      ];
    }

    return await prisma.policyDocument.findMany({
      where,
      orderBy: { id: 'asc' }
    });
  }

  async getDocumentById(id) {
    return await prisma.policyDocument.findUnique({
      where: { id }
    });
  }
}

export const retrievalService = new RetrievalService();
