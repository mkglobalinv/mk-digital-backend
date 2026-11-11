/**
 * Deployment Provider Abstraction
 * Supports multiple deployment providers for custom domains.
 * Initial provider: Railway. Future-ready for Vercel, Cloudflare, etc.
 */

import railwayService from './railwayService.js';
import { runDomainHelper } from './domains/vpsProvisioner.js';

// Self-hosted VPS: domains are provisioned by the services/domains state
// machine; these methods expose the same interface for callers of this class.
const vpsService = {
  async createCustomDomain(domain) { return runDomainHelper('prepare', domain); },
  async getDomainStatus(domain) { return runDomainHelper('cert-info', domain); },
  async deleteCustomDomain(domain) { return runDomainHelper('remove', domain); }
};

class DeploymentProvider {
  constructor(providerName = 'railway') {
    this.providerName = providerName;
  }

  getProvider() {
    switch (this.providerName.toLowerCase()) {
      case 'railway':
        return railwayService;
      case 'vps':
        return vpsService;
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
