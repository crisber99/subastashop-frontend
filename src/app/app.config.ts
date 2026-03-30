import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tenantInterceptor } from './interceptors/tenant-interceptor';

import { authInterceptor } from './interceptors/auth-interceptor';
import { loaderInterceptor } from './interceptors/loader-interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideServiceWorker } from '@angular/service-worker';
import { SOCIAL_AUTH_CONFIG, SocialAuthServiceConfig, GoogleLoginProvider } from '@abacritt/angularx-social-login';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: APP_BASE_HREF, useValue: '/' },
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, tenantInterceptor, loaderInterceptor])),
    provideCharts(withDefaultRegisterables()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('224562249308-1ajh4ulhth30ahnlqlp8eb92d1gfor1a.apps.googleusercontent.com')
          }
        ],
        onError: (err) => {
          console.error("Error Social Auth:", err);
        }
      } as SocialAuthServiceConfig,
    }
  ]
};
