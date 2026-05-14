import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise && uri) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise || Promise.reject(new Error('Missing MONGODB_URI environment variable.'));
} else {
    if (uri) {
        client = new MongoClient(uri);
        clientPromise = client.connect();
    } else {
        clientPromise = Promise.reject(new Error('Missing MONGODB_URI environment variable.'));
    }
}

export default clientPromise;
