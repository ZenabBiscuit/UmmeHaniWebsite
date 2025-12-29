import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';  // ✅ use provideHttpClient
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

const firebaseConfig = {
  authDomain: "ummehani-arts.firebaseapp.com",
  projectId: "ummehani-arts",
  storageBucket: "ummehani-arts.appspot.com", // 👈 small fix here
  messagingSenderId: "89639424749",
  appId: "1:89639424749:web:6a9c3a6b21e083eca8f2e4"
};

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
        
      })),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'  // Register service worker when stable
    })
  ]
});

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
