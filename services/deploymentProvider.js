/**
 * Deployment Provider Abstraction
 * Supports multiple deployment providers for custom domains.
 * Initial provider: Railway. Future-ready for Vercel, Cloudflare, etc.
 */

import railwayService from './railwayService.js';

class DeploymentProvider {
  constructor(providerName = 'railway') {
    this.providerName = providerName;
  }

  getProvider() {
    switch (this.providerName.toLowerCase()) {
      case 'railway':
        return railwayService;
      // Add future providers here
      // case 'vercel': return vercelService;
      // case 'cloudflare': return cloudflareService;
      default:
        throw new Error(`Deployment provider ${this.providerName} is not supported.`);
    }
  }

  async createCustomDomain(domain) {
    const provider = this.getProvider();
    return await provider.createCustomDomain(domain);
  }

  async getDomainStatus(domain) {
    const provider = this.getProvider();
    return await provider.getDomainStatus(domain);
  }

  async deleteCustomDomain(domain) {
    const provider = this.getProvider();
    return await provider.deleteCustomDomain(domain);
  }
}

export default new DeploymentProvider('railway');
