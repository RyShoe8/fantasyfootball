import { MongoClient, MongoClientOptions } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasyfootball';
const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // Disable all browser-incompatible features
  autoEncryption: undefined,
  monitorCommands: false,
  directConnection: true,
  tls: false,
  minHeartbeatFrequencyMS: 5000,
  // Only use authentication if credentials are provided in the URI
  authMechanism: uri.includes('@') ? 'SCRAM-SHA-256' : undefined,
  authSource: uri.includes('@') ? 'admin' : undefined,
  retryWrites: false,
  retryReads: false
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Only initialize MongoDB on the server side
if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  // In the browser, return a dummy promise that never resolves
  clientPromise = new Promise(() => {});
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;