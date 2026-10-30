const mongoose = require('mongoose');
const config = require('./config');
const cluster = require('cluster');

const {
    server: { mongoHost, mongoPort, dbName, poolSize, nodeEnv, prodDbUrl }
} = config;

function buildMongoUrl() {
    // Prefer explicit full URIs (works for both SRV and non-SRV).
    const explicit =
        process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        process.env.MONGO_DB_URL ||
        (nodeEnv === "PROD" ? prodDbUrl : undefined);

    if (explicit && typeof explicit === "string" && explicit.trim().length > 0) {
        return explicit.trim();
    }

    // Default: local MongoDB (avoids SRV DNS lookups).
    const host = mongoHost || "127.0.0.1";
    const port = mongoPort || 27017;
    const name = dbName || "template";
    return `mongodb://${host}:${port}/${name}`;
}

const mongoUrl = buildMongoUrl();

// Making MongoDB Connection using mongoose
exports.connect = () => {
    mongoose.set('strictQuery', true);
    mongoose
        .connect(mongoUrl, {
            maxPoolSize: Number(poolSize) || 100
        })
        .then(() => {

            if (cluster.isMaster) {
                console.log(`=============== 🚀🚀🚀 Successfully connected to ${nodeEnv} mongo database 🚀🚀🚀 ===============`);
                console.log(`=============== 🚀🚀🚀 Database name: ${dbName} 🚀🚀🚀 =============== \n`);
            }
        })
        .catch((error) => {
            console.log('Mongo connection failed. exiting now...');
            if (
                error?.code === "ECONNREFUSED" &&
                typeof error?.hostname === "string" &&
                error.hostname.startsWith("_mongodb._tcp.")
            ) {
                console.error(
                    "SRV DNS lookup failed. If your network/DNS blocks SRV records, set MONGO_URI to a non-SRV connection string (mongodb://...) or switch to a DNS resolver that supports SRV.",
                );
            }
            console.error(error);
            /* eslint-disable */
            process.exit(1);
        });
};
