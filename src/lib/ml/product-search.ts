import type { PrismaClient } from '@prisma/client';
import natural from 'natural';

export interface SearchResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  score: number;
}

export class ProductSearch {
  private prisma: PrismaClient;
  private tfidf: natural.TfIdf;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private productMap: Map<number, any>; // Index -> Product
  private isReady: boolean = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.tfidf = new natural.TfIdf();
    this.productMap = new Map();
  }

  /**
   * Charge les produits et construit l'index TF-IDF
   */
  async init() {
    console.log('🧠 [ML] Building Product Knowledge Base...');
    const products = await this.prisma.product.findMany({
      include: {
        beyblades: { include: { blade: true, ratchet: true, bit: true } },
      },
    });

    products.forEach((p, index) => {
      // Construction du "document" textuel représentant le produit
      // On inclut le code, nom, type, et les pièces
      let content = `${p.code} ${p.name} ${p.productType} ${p.productLine}`;

      if (p.nameEn) content += ` ${p.nameEn}`;

      p.beyblades.forEach((b) => {
        content += ` ${b.name} ${b.blade.name} ${b.ratchet.name} ${b.bit.name}`;
        // Ajout de mots clés de type
        if (b.beyType) content += ` ${b.beyType}`;
      });

      this.tfidf.addDocument(content);
      this.productMap.set(index, p);
    });

    this.isReady = true;
    console.log(
      `🧠 [ML] Knowledge Base ready with ${products.length} products.`,
    );
  }

  /**
   * Recherche sémantique/keyword
   */
  search(query: string, limit = 3): SearchResult[] {
    if (!this.isReady) {
      console.warn('⚠️ ML Search not ready yet.');
      return [];
    }

    const results: SearchResult[] = [];

    this.tfidf.tfidfs(query, (i, measure) => {
      if (measure > 0) {
        results.push({
          product: this.productMap.get(i),
          score: measure,
        });
      }
    });

    // Tri par pertinence et limite
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
