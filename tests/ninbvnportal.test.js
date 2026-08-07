const NINBVNPortalProvider = require('../services/providers/ninbvnportal');
const axios = require('axios');

jest.mock('axios');

describe('NINBVNPORTAL Provider (Standalone)', () => {
    let provider;
    
    beforeEach(() => {
        // Setup isolated provider instance
        provider = new NINBVNPortalProvider('TEST_KEY');
        
        // Mock the axios instance methods that the provider sets up
        provider.client = {
            post: jest.fn(),
            get: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() }
            }
        };
        
        // Reset console spies
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should automatically inject consent: true into payloads', async () => {
        provider.client.post.mockResolvedValue({ data: { status: 'success', data: { firstName: 'John' } } });
        
        const result = await provider.verifyNIN('12345678901');
        
        expect(provider.client.post).toHaveBeenCalledWith('/nin-verification', {
            number: '12345678901',
            consent: true
        });
        
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('success');
    });

    test('maskPII should securely redact sensitive data', () => {
        const rawPayload = {
            number: '12345678901',
            consent: true,
            firstName: 'ALIKO',
            nested: {
                bvn: '22223333444'
            }
        };
        
        const masked = provider.maskPII(rawPayload);
        
        expect(masked.number).toBe('12******01');
        expect(masked.consent).toBe(true); // Should not mask booleans
        expect(masked.firstName).toBe('AL******KO');
        expect(masked.nested.bvn).toBe('22******44');
    });

    test('should normalize error responses', () => {
        const mockError = {
            message: 'Request failed with status code 400',
            response: {
                status: 400,
                data: { message: 'Missing consent field' }
            }
        };

        const normalized = provider.normalizeError(mockError);
        
        expect(normalized.success).toBe(false);
        expect(normalized.provider).toBe('NINBVNPORTAL');
        expect(normalized.statusCode).toBe(400);
        expect(normalized.message).toBe('Missing consent field');
    });

    test('should handle network timeout errors gracefully', () => {
        const mockTimeoutError = {
            message: 'timeout of 20000ms exceeded',
            request: {} // indicates request made but no response
        };

        const normalized = provider.normalizeError(mockTimeoutError);
        expect(normalized.success).toBe(false);
        expect(normalized.statusCode).toBe(500);
        expect(normalized.message).toBe('timeout of 20000ms exceeded');
    });
});
