/**
 * Lightweight deterministic TF-IDF Keyword Retrieval Engine
 * Provides genuine lexical & metadata relevance scoring without external API dependencies.
 */

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'shant', 'she', 'should', 'shouldnt', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'were',
  'werent', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'wont', 'would',
  'wouldnt', 'you', 'your', 'yours', 'yourself', 'yourselves', 'please', 'hello', 'hi', 'team', 'noise'
]);

export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
}

export class TFIDFIndex {
  constructor(documents = []) {
    this.documents = documents; // array of { id, text, metadata }
    this.docCount = documents.length;
    this.df = new Map(); // term -> document frequency
    this.docVectors = new Map(); // docId -> { term -> tfidf }
    this.build();
  }

  build() {
    this.docCount = this.documents.length;
    this.df.clear();
    this.docVectors.clear();

    const docTermFreqs = new Map();

    // 1. Calculate term frequencies per doc and overall document frequencies
    for (const doc of this.documents) {
      const tokens = tokenize(doc.text);
      const tf = new Map();
      const uniqueTerms = new Set();

      for (const term of tokens) {
        tf.set(term, (tf.get(term) || 0) + 1);
        uniqueTerms.add(term);
      }

      docTermFreqs.set(doc.id, { tf, totalTokens: tokens.length });

      for (const term of uniqueTerms) {
        this.df.set(term, (this.df.get(term) || 0) + 1);
      }
    }

    // 2. Compute TF-IDF vectors for each document
    for (const doc of this.documents) {
      const { tf, totalTokens } = docTermFreqs.get(doc.id);
      const vector = new Map();

      for (const [term, freq] of tf.entries()) {
        const tfScore = freq / (totalTokens || 1);
        const idfScore = Math.log(1 + (this.docCount / (this.df.get(term) || 1)));
        vector.set(term, tfScore * idfScore);
      }

      this.docVectors.set(doc.id, vector);
    }
  }

  scoreQuery(queryText, categoryHint = null) {
    const queryTokens = tokenize(queryText);
    if (queryTokens.length === 0) return [];

    const queryTf = new Map();
    for (const term of queryTokens) {
      queryTf.set(term, (queryTf.get(term) || 0) + 1);
    }

    const results = [];

    for (const doc of this.documents) {
      const docVector = this.docVectors.get(doc.id) || new Map();
      let dotProduct = 0;
      let queryNorm = 0;
      let docNorm = 0;

      for (const [term, qFreq] of queryTf.entries()) {
        const qWeight = qFreq * Math.log(1 + (this.docCount / (this.df.get(term) || 1)));
        queryNorm += qWeight * qWeight;

        const dWeight = docVector.get(term) || 0;
        dotProduct += qWeight * dWeight;
      }

      for (const [, dWeight] of docVector.entries()) {
        docNorm += dWeight * dWeight;
      }

      let similarity = 0;
      if (queryNorm > 0 && docNorm > 0) {
        similarity = dotProduct / (Math.sqrt(queryNorm) * Math.sqrt(docNorm));
      }

      // Metadata boost for exact tag or category match
      let boost = 0;
      if (categoryHint && doc.metadata && doc.metadata.category) {
        const docCat = doc.metadata.category.toUpperCase();
        const hint = categoryHint.toUpperCase();
        if (docCat.includes(hint) || hint.includes(docCat)) {
          boost += 0.25;
        }
      }

      const finalScore = Math.min(1.0, Math.max(0.0, similarity + boost));

      if (finalScore > 0.05) {
        results.push({
          id: doc.id,
          score: parseFloat(finalScore.toFixed(3)),
          document: doc
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}
