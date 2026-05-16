import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns service health metadata', () => {
    const service = new HealthService();

    const result = service.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('byyouside-api');
    expect(result.timestamp).toEqual(expect.any(String));
  });
});
