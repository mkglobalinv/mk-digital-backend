import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

class RailwayService {
  constructor() {
    this.token = process.env.RAILWAY_API_TOKEN;
    this.environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
    this.projectId = process.env.RAILWAY_PROJECT_ID;
    this.serviceId = process.env.RAILWAY_SERVICE_ID;
  }

  getHeaders() {
    if (!this.token) {
      throw new Error("RAILWAY_API_TOKEN is missing in the environment variables.");
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  validateConfig() {
    if (!this.environmentId || !this.projectId || !this.serviceId) {
      throw new Error("Railway infrastructure variables (Environment ID, Project ID, Service ID) are missing.");
    }
  }

  async executeGraphQL(query, variables = {}) {
    const maxRetries = process.env.RAILWAY_MAX_RETRIES || 3;
    const baseDelay = process.env.RAILWAY_RETRY_DELAY_MS || 2000;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.post(
          RAILWAY_API_URL,
          { query, variables },
          { headers: this.getHeaders(), timeout: 10000 }
        );

        if (response.data.errors) {
          const errorMsg = response.data.errors.map(e => e.message).join(', ');
          
          if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
             const error = new Error(`DomainAlreadyExists: ${errorMsg}`);
             error.code = 'DOMAIN_ALREADY_EXISTS';
             throw error;
          }
          
          if (errorMsg.includes('unauthorized') || errorMsg.includes('invalid token')) {
             const error = new Error(`InvalidToken: ${errorMsg}`);
             error.code = 'INVALID_TOKEN';
             throw error; // Fail immediately on auth errors
          }
          
          throw new Error(`Railway API Error: ${errorMsg}`);
        }

        return response.data.data;
      } catch (err) {
        // Detect 429 Rate Limit from HTTP response
        if (err.response && err.response.status === 429) {
            console.warn(`[Railway] Rate limit exceeded. Retrying in ${baseDelay * (i + 1)}ms...`);
            if (i === maxRetries - 1) {
                const error = new Error('RateLimitExceeded');
                error.code = 'RATE_LIMIT_EXCEEDED';
                throw error;
            }
        } else if (err.code === 'INVALID_TOKEN' || err.code === 'DOMAIN_ALREADY_EXISTS') {
            throw err; // Do not retry these specific structural errors
        } else if (i === maxRetries - 1) {
            throw err;
        }
        
        // Exponential backoff for transient errors
        await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, i)));
      }
    }
  }

  async createCustomDomain(domain) {
    this.validateConfig();
    const mutation = `
      mutation customDomainCreate($environmentId: String!, $projectId: String!, $serviceId: String!, $domain: String!) {
        customDomainCreate(input: {
          environmentId: $environmentId,
          projectId: $projectId,
          serviceId: $serviceId,
          domain: $domain
        }) {
          id
          domain
          status
        }
      }
    `;

    try {
      const data = await this.executeGraphQL(mutation, {
        environmentId: this.environmentId,
        projectId: this.projectId,
        serviceId: this.serviceId,
        domain
      });
      return data.customDomainCreate;
    } catch (err) {
      console.error(`[Railway] Error creating custom domain ${domain}:`, err.message);
      throw err;
    }
  }

  async getDomainStatus(domain) {
    this.validateConfig();
    const query = `
      query customDomain($domain: String!, $environmentId: String!, $projectId: String!, $serviceId: String!) {
        customDomain(
          domain: $domain, 
          environmentId: $environmentId, 
          projectId: $projectId, 
          serviceId: $serviceId
        ) {
          id
          domain
          status
          dnsRecords {
            type
            name
            value
            status
          }
          sslStatus
        }
      }
    `;

    try {
      const data = await this.executeGraphQL(query, {
        environmentId: this.environmentId,
        projectId: this.projectId,
        serviceId: this.serviceId,
        domain
      });
      return data.customDomain;
    } catch (err) {
      console.error(`[Railway] Error fetching domain status for ${domain}:`, err.message);
      throw err;
    }
  }

  async deleteCustomDomain(domain) {
    this.validateConfig();
    const mutation = `
      mutation customDomainDelete($environmentId: String!, $projectId: String!, $serviceId: String!, $domain: String!) {
        customDomainDelete(input: {
          environmentId: $environmentId,
          projectId: $projectId,
          serviceId: $serviceId,
          domain: $domain
        })
      }
    `;

    try {
      const data = await this.executeGraphQL(mutation, {
        environmentId: this.environmentId,
        projectId: this.projectId,
        serviceId: this.serviceId,
        domain
      });
      return data.customDomainDelete;
    } catch (err) {
      console.error(`[Railway] Error deleting custom domain ${domain}:`, err.message);
      throw err;
    }
  }
}

export default new RailwayService();
