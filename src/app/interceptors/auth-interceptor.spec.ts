import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpInterceptorFn, HttpResponse, HttpEventType } from '@angular/common/http';
import { of } from 'rxjs';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth-service';

describe('authInterceptor', () => {
  let authServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      getToken: jasmine.createSpy('getToken').and.returnValue('test-token')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
  });

  const interceptor: HttpInterceptorFn = (req, next) => 
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  // Helper para crear una respuesta exitosa
  const mockResponse = new HttpResponse({ status: 200, statusText: 'OK', body: {} });

  it('should add an Authorization header if a token exists', (done) => {
    const httpRequest = new HttpRequest('GET', '/api/data');
    const next: HttpHandlerFn = (req: HttpRequest<unknown>) => {
      expect(req.headers.has('Authorization')).toBeTrue();
      expect(req.headers.get('Authorization')).toBe('Bearer test-token');
      return of(mockResponse);
    };

    interceptor(httpRequest, next).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          expect(event).toBe(mockResponse);
          done();
        }
      },
      error: (err) => fail(err)
    });
  });

  it('should NOT add an Authorization header for login requests', (done) => {
    const httpRequest = new HttpRequest('POST', '/api/auth/login', {});
    const next: HttpHandlerFn = (req: HttpRequest<unknown>) => {
      expect(req.headers.has('Authorization')).toBeFalse();
      return of(mockResponse);
    };

    interceptor(httpRequest, next).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          done();
        }
      },
      error: (err) => fail(err)
    });
  });

  it('should NOT add an Authorization header for register requests', (done) => {
    const httpRequest = new HttpRequest('POST', '/api/auth/register', {});
    const next: HttpHandlerFn = (req: HttpRequest<unknown>) => {
      expect(req.headers.has('Authorization')).toBeFalse();
      return of(mockResponse);
    };

    interceptor(httpRequest, next).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          done();
        }
      },
      error: (err) => fail(err)
    });
  });

  it('should pass the request as is if no token exists', (done) => {
    authServiceMock.getToken.and.returnValue(null);
    const httpRequest = new HttpRequest('GET', '/api/data');
    const next: HttpHandlerFn = (req: HttpRequest<unknown>) => {
      expect(req.headers.has('Authorization')).toBeFalse();
      return of(mockResponse);
    };

    interceptor(httpRequest, next).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          done();
        }
      },
      error: (err) => fail(err)
    });
  });
});
