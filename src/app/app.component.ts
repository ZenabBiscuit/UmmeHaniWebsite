import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterOutlet, Scroll } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NotificationComponent } from './notification/notification.component';
import { LoaderService } from './services/loader.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule, NotificationComponent], // 👈 include Header
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {

  loading = false;
  isAdminRoute = false;
  isNotifVisible = false;
  private restoring = false;

  constructor(private router: Router, private renderer: Renderer2, private loader: LoaderService, private http: HttpClient) {
    this.router.events
      .pipe(filter(e => e instanceof Scroll))
      .subscribe((e: Scroll) => {
        if (e.position) {
          this.restoring = true;

          // temporarily disable scroll + hide content
          this.renderer.setStyle(document.body, 'opacity', '0');
          this.renderer.setStyle(document.body, 'overflow', 'hidden');

          requestAnimationFrame(() => {
            window.scrollTo({
              top: e.position![1],
              left: e.position![0],
              behavior: 'auto' // NOT smooth — prevents jump feeling
            });

            // restore UI
            setTimeout(() => {
              this.renderer.removeStyle(document.body, 'opacity');
              this.renderer.removeStyle(document.body, 'overflow');
              this.restoring = false;
            }, 50);
          });
        }
      });
  }

  /** ✅ SAFE derived state */
  get bannerVisible(): boolean {
    return this.isNotifVisible && !this.isAdminRoute;
  }

  ngOnInit(): void {

    /* Loader */
    this.loader.loading$.subscribe((state: boolean) => {
      Promise.resolve().then(() => {
        this.loading = state;
      });
    });

    /* Router changes */
    this.router.events.subscribe(() => {
      Promise.resolve().then(() => {
        this.isAdminRoute = this.router.url.startsWith('/admin_ummehani@786110');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /* Notification visibility */
  onNotificationVisibility(value: boolean): void {
    Promise.resolve().then(() => {
      this.isNotifVisible = value;
    });
    
  }
}