// Provides utility methods for comparing text embeddings
class Matcher {

  // Calculates cosine similarity between two vectors, a and b
  static cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));

    // Cosine similarity formula:
    return dotProduct / (magnitudeA * magnitudeB);
  }
}