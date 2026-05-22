/**
 * @module scripts/seed
 * @description Script de seed para popular o banco de dados com dados geoespaciais de exemplo.
 * Gera 5000 documentos GeoJSON Point distribuídos entre Brasil (~3000) e global (~2000).
 * Cria índice 2dsphere no campo 'location' para consultas geoespaciais eficientes.
 *
 * Uso: npm run seed
 */

import dotenv from 'dotenv';

/* Carrega variáveis de ambiente */
dotenv.config();

import { MongoClient } from 'mongodb';
import { PostDocument, GeoJSONPoint } from '../types';

/** URI de conexão com o MongoDB */
const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017';

/** Nome do banco de dados */
const MONGODB_DB_NAME: string = process.env.MONGODB_DB_NAME || 'geo_mvt_db';

/** Nome da coleção alvo */
const COLLECTION_NAME = 'posts_layer';

/** Total de documentos a gerar */
const TOTAL_DOCUMENTS = 5000000;

/** Documentos concentrados no Brasil */
const BRAZIL_COUNT = 300000;

/** Documentos distribuídos globalmente */
const GLOBAL_COUNT = 200000;

/** Tamanho de cada lote para inserção */
const BATCH_SIZE = 20000;

/** Categorias disponíveis para os posts */
const CATEGORIES: string[] = ['evento', 'notícia', 'alerta', 'promoção', 'informação'];

/**
 * Gera um número aleatório dentro de um intervalo (inclusivo).
 *
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns {number} Número aleatório entre min e max
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Gera uma data aleatória nos últimos 30 dias.
 *
 * @returns {Date} Data aleatória entre 30 dias atrás e agora
 */
function randomDateLast30Days(): Date {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * thirtyDaysMs;
  return new Date(now - randomMs);
}

/**
 * Gera um ponto GeoJSON com coordenadas concentradas no Brasil.
 *
 * Limites geográficos do Brasil (aproximados):
 * - Latitude: -33.75 a 5.27
 * - Longitude: -73.99 a -34.79
 *
 * @returns {GeoJSONPoint} Ponto GeoJSON com coordenadas no Brasil
 */
function generateBrazilPoint(): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [
      parseFloat(randomInRange(-74, -34).toFixed(6)),
      parseFloat(randomInRange(-33, 5).toFixed(6)),
    ],
  };
}

/**
 * Gera um ponto GeoJSON com coordenadas distribuídas globalmente.
 *
 * Limites:
 * - Latitude: -60 a 70 (evita regiões polares extremas)
 * - Longitude: -180 a 180
 *
 * @returns {GeoJSONPoint} Ponto GeoJSON com coordenadas globais
 */
function generateGlobalPoint(): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [
      parseFloat(randomInRange(-180, 180).toFixed(6)),
      parseFloat(randomInRange(-60, 70).toFixed(6)),
    ],
  };
}

/**
 * Gera um documento de post com localização geoespacial.
 *
 * @param index - Índice numérico do documento (usado no título)
 * @param isBrazil - Se verdadeiro, gera coordenadas no Brasil; caso contrário, globais
 * @returns {Omit<PostDocument, '_id'>} Documento pronto para inserção (sem _id)
 */
function generateDocument(index: number, isBrazil: boolean): Omit<PostDocument, '_id'> {
  const location = isBrazil ? generateBrazilPoint() : generateGlobalPoint();
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  return {
    location,
    title: `Post #${index}`,
    category,
    createdAt: randomDateLast30Days(),
  };
}

/**
 * Função principal do script de seed.
 * Conecta ao MongoDB, recria a coleção com índice 2dsphere
 * e insere 5000 documentos em lotes de 1000.
 */
async function seed(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log(`[Seed] Conectando ao MongoDB em ${MONGODB_URI}...`);
    await client.connect();

    const db = client.db(MONGODB_DB_NAME);

    /* Remove a coleção existente, se houver */
    console.log(`[Seed] Removendo coleção "${COLLECTION_NAME}" existente (se houver)...`);
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length > 0) {
      await db.dropCollection(COLLECTION_NAME);
      console.log(`[Seed] Coleção "${COLLECTION_NAME}" removida com sucesso.`);
    }

    /* Cria a coleção */
    console.log(`[Seed] Criando coleção "${COLLECTION_NAME}"...`);
    const collection = db.collection(COLLECTION_NAME);

    /* Cria índice 2dsphere no campo 'location' para consultas geoespaciais */
    console.log(`[Seed] Criando índice 2dsphere no campo "location"...`);
    await collection.createIndex({ location: '2dsphere' });
    console.log(`[Seed] Índice 2dsphere criado com sucesso.`);

    /* Gera todos os documentos */
    console.log(`\n[Seed] Gerando ${TOTAL_DOCUMENTS} documentos...`);
    console.log(`  - ${BRAZIL_COUNT} concentrados no Brasil`);
    console.log(`  - ${GLOBAL_COUNT} distribuídos globalmente\n`);

    const allDocuments: Omit<PostDocument, '_id'>[] = [];

    /* Gera documentos do Brasil */
    for (let i = 0; i < BRAZIL_COUNT; i++) {
      allDocuments.push(generateDocument(i + 1, true));
    }

    /* Gera documentos globais */
    for (let i = 0; i < GLOBAL_COUNT; i++) {
      allDocuments.push(generateDocument(BRAZIL_COUNT + i + 1, false));
    }

    /* Insere em lotes para melhor performance e feedback de progresso */
    let totalInserted = 0;
    const totalBatches = Math.ceil(allDocuments.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, allDocuments.length);
      const batch = allDocuments.slice(start, end);

      const result = await collection.insertMany(batch);
      totalInserted += result.insertedCount;

      console.log(
        `[Seed] Lote ${batchIndex + 1}/${totalBatches}: ${result.insertedCount} documentos inseridos ` +
        `(total: ${totalInserted}/${TOTAL_DOCUMENTS})`
      );
    }

    console.log(`\n[Seed] ✅ Seed concluído com sucesso!`);
    console.log(`[Seed] Total de documentos inseridos: ${totalInserted}`);
    console.log(`[Seed] Coleção: ${COLLECTION_NAME}`);
    console.log(`[Seed] Banco: ${MONGODB_DB_NAME}`);
  } catch (error) {
    console.error('[Seed] ❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    /* Encerra a conexão com o MongoDB */
    await client.close();
    console.log('[Seed] Conexão com o MongoDB encerrada.');
    process.exit(0);
  }
}

/* Executa o script */
seed();
