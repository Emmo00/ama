import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

/**
 * Initialize a new Farcaster mini app project
 * @returns Promise<void>
 */
export function init(): Promise<void>; 