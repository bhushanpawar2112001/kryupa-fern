import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new UUID v4.
 * Use this anywhere you need to create an ID before inserting into MongoDB
 * so we are never dependent on Mongo's ObjectId for application-level identity.
 */
export function generateUuid(): string {
  return uuidv4();
}
