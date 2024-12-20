import { JwtAuthGuard } from './jwt.guard';
import { ExecutionContext } from '@nestjs/common';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn(() => {
    return class {
      canActivate = jest.fn(() => true);
    };
  }),
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should call canActivate method', () => {
    const mockExecutionContext: Partial<ExecutionContext> = {
      switchToHttp: jest.fn(),
    };

    const canActivateSpy = jest.spyOn(guard, 'canActivate' as any);
    guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(canActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
  });
});
