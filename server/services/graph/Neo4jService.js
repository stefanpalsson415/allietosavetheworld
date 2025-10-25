// Production Neo4j Service
// Real driver, production-ready, scalable
// Converted to CommonJS for compatibility with Express routes

const neo4j = require('neo4j-driver');

class Neo4jService {
  constructor() {
    this.driver = null;
    this.connected = false;
  }

  /**
   * Initialize Neo4j connection
   */
  async connect() {
    if (this.connected) return;

    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD;

    if (!password) {
      throw new Error('NEO4J_PASSWORD environment variable is required');
    }

    this.driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000,
        maxTransactionRetryTime: 30000
      }
    );

    // Verify connectivity
    try {
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();
      this.connected = true;
      console.log('✅ Neo4j connected successfully');
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a new session
   * @returns {Session} Neo4j session
   */
  async getSession() {
    if (!this.connected) await this.connect();
    return this.driver.session();
  }

  /**
   * Run read query
   */
  async runQuery(cypher, params = {}) {
    if (!this.connected) await this.connect();

    const session = this.driver.session({ defaultAccessMode: neo4j.session.READ });

    try {
      const result = await session.run(cypher, params);
      return result.records.map(record => {
        const obj = {};
        record.keys.forEach(key => {
          obj[key] = this._convertNeo4jValue(record.get(key));
        });
        return obj;
      });
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Run write query
   */
  async runWriteQuery(cypher, params = {}) {
    if (!this.connected) await this.connect();

    const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });

    try {
      const result = await session.run(cypher, params);
      return result.records.map(record => {
        const obj = {};
        record.keys.forEach(key => {
          obj[key] = this._convertNeo4jValue(record.get(key));
        });
        return obj;
      });
    } catch (error) {
      console.error('Write query error:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Run multiple queries in transaction
   */
  async runTransaction(queries) {
    if (!this.connected) await this.connect();

    const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });

    try {
      const result = await session.writeTransaction(async tx => {
        const results = [];
        for (const { cypher, params } of queries) {
          const res = await tx.run(cypher, params);
          results.push(res.records);
        }
        return results;
      });

      return result;
    } catch (error) {
      console.error('Transaction error:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Convert Neo4j types to JavaScript
   */
  _convertNeo4jValue(value) {
    if (value === null || value === undefined) return null;

    // Neo4j Integer
    if (neo4j.isInt(value)) {
      return value.toNumber();
    }

    // Neo4j Node
    if (value.labels) {
      return {
        ...value.properties,
        _labels: value.labels,
        _id: value.identity.toNumber()
      };
    }

    // Neo4j Relationship
    if (value.type) {
      return {
        ...value.properties,
        _type: value.type,
        _id: value.identity?.toNumber ? value.identity.toNumber() : value.identity,
        _start: value.start?.toNumber ? value.start.toNumber() : value.start,
        _end: value.end?.toNumber ? value.end.toNumber() : value.end
      };
    }

    // Array
    if (Array.isArray(value)) {
      return value.map(v => this._convertNeo4jValue(v));
    }

    // Object
    if (typeof value === 'object') {
      const obj = {};
      for (const [k, v] of Object.entries(value)) {
        obj[k] = this._convertNeo4jValue(v);
      }
      return obj;
    }

    return value;
  }

  /**
   * Close connection
   */
  async close() {
    if (this.driver) {
      await this.driver.close();
      this.connected = false;
      console.log('Neo4j connection closed');
    }
  }
}

// Singleton instance
const neo4jService = new Neo4jService();

module.exports = neo4jService;
