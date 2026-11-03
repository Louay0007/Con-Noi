import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersQueryDto, ApplicationsQueryDto, AuditQueryDto } from './query.dto';

const parse = async <T extends object>(cls: new () => T, query: Record<string, unknown>) => {
  const dto = plainToInstance(cls, query, { enableImplicitConversion: true });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, errors };
};

describe('admin list query DTOs', () => {
  it('accepts the filters the admin UI sends', async () => {
    const { dto, errors } = await parse(UsersQueryDto, { page: '2', limit: '20', q: 'Marco', role: 'worker', isActive: 'false' });
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.q).toBe('Marco');
    // Regression: enableImplicitConversion made "false" become true.
    expect(dto.isActive).toBe('false');
  });

  it('rejects unknown filter keys', async () => {
    const { errors } = await parse(UsersQueryDto, { status: 'submitted' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects values outside the enum', async () => {
    expect((await parse(UsersQueryDto, { isActive: 'maybe' })).errors.length).toBeGreaterThan(0);
    expect((await parse(UsersQueryDto, { role: 'superadmin' })).errors.length).toBeGreaterThan(0);
    expect((await parse(ApplicationsQueryDto, { status: 'nonsense' })).errors.length).toBeGreaterThan(0);
    expect((await parse(AuditQueryDto, { entity: 'billing' })).errors.length).toBeGreaterThan(0);
  });

  it('treats cleared filters as absent', async () => {
    for (const [cls, field] of [[UsersQueryDto, 'q'], [ApplicationsQueryDto, 'postId'], [AuditQueryDto, 'action']] as const) {
      const { dto, errors } = await parse(cls, { [field]: '' });
      expect(errors).toHaveLength(0);
      expect((dto as Record<string, unknown>)[field]).toBeUndefined();
    }
  });
});
