/**
 * Example: Custom storage adapter for MongoDB
 * 
 * This example requires the 'mongodb' package:
 * npm install mongodb
 * 
 * Run: node examples/storage-adapter.js
 */

const { MongoClient } = require('mongodb');
const { Client, GatewayIntentBits } = require('discord.js');
const { DynamicVoiceManager } = require('../dist/index');

// Custom MongoDB adapter implementing the StorageAdapter interface
class MongoDBAdapter {
  constructor(uri, dbName, collectionName) {
    this.uri = uri;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.client = null;
    this.collection = null;
  }

  async connect() {
    this.client = new MongoClient(this.uri);
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.collection = db.collection(this.collectionName);
  }

  async get(key) {
    if (!this.collection) await this.connect();
    const doc = await this.collection.findOne({ _id: key });
    return doc ? doc.value : null;
  }

  async set(key, value) {
    if (!this.collection) await this.connect();
    await this.collection.updateOne(
      { _id: key },
      { $set: { value } },
      { upsert: true }
    );
  }

  async delete(key) {
    if (!this.collection) await this.connect();
    await this.collection.deleteOne({ _id: key });
  }

  async getAll(prefix) {
    if (!this.collection) await this.connect();
    const query = prefix ? { _id: { $regex: `^${prefix}` } } : {};
    const docs = await this.collection.find(query).toArray();
    const map = new Map();
    for (const doc of docs) {
      map.set(doc._id, doc.value);
    }
    return map;
  }
}

const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const CREATOR_CHANNEL_ID = '123456789012345678';
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'discord_bot';
const COLLECTION_NAME = 'dynamic_voice_state';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

async function start() {
  const adapter = new MongoDBAdapter(MONGO_URI, DB_NAME, COLLECTION_NAME);
  await adapter.connect();
  console.log('Connected to MongoDB');

  const voiceManager = new DynamicVoiceManager(client, {
    creatorChannelId: CREATOR_CHANNEL_ID,
    storageAdapter: adapter,
    autoDeleteWhenEmpty: true
  });

  voiceManager.on('channelCreated', (channel, creator) => {
    console.log(`Channel created by ${creator.tag} – state saved to MongoDB`);
  });

  client.on('ready', async () => {
    await voiceManager.init();
    console.log(`Bot ready`);
  });

  client.login(BOT_TOKEN);
}

start().catch(console.error);