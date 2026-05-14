import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
}

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

const clientPromise = global._mongoClientPromise || client.connect();

if (process.env.NODE_ENV !== 'production') {
    global._mongoClientPromise = clientPromise;
}

export default clientPromise;
