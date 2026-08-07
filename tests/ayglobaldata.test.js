import AYGlobalDataProvider from '../services/providers/ayglobaldata.js';
import axios from 'axios';

jest.mock('axios');

describe('AY Global Data Provider (Standalone)', () => {
    let provider;
    
    beforeEach(() => {
        // Setup isolated provider instance
        provider = new AYGlobalDataProvider('TEST_KEY');
        
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

    test('should properly form airtime purchase request', async () => {
        provider.client.post.mockResolvedValue({ data: { status: 'success', amount_paid: 98 } });
        
        const result = await provider.buyAirtime('1', '08012345678', 100, 'AIR_123');
        
        expect(provider.client.post).toHaveBeenCalledWith('/airtime/', {
            network: '1',
            phone: '08012345678',
            amount: 100,
            ref: 'AIR_123',
            ported_number: "false"
        }, expect.any(Object));
        
        expect(result.success).toBe(true);
    });

    test('should properly form identity verification request', async () => {
        provider.client.post.mockResolvedValue({ data: { status: 'success' } });
        
        await provider.verifyIdentity('nin', 'phone', '08012345678');
        
        expect(provider.client.post).toHaveBeenCalledWith('/verify/', {
            type: 'nin',
            method: 'phone',
            value: '08012345678',
            slip_type: 'information'
        }, expect.any(Object));
    });

    test('maskPII should securely redact sensitive data', () => {
        const rawPayload = {
            phone: '08012345678',
            meternumber: '11112222333',
            amount: 1000
        };
        
        const masked = provider.maskPII(rawPayload);
        
        expect(masked.phone).toBe('08******78');
        expect(masked.meternumber).toBe('11******33');
        expect(masked.amount).toBe(1000); // Should not mask amount
    });
});
