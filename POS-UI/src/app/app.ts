import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ToastComponent } from './shared/components/toast.component';
import { AuthService } from './core/services/auth.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  loading = signal(true);

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.checkAuth();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      take(1)
    ).subscribe(() => {
      this.loading.set(false);
    });
    setTimeout(() => this.loading.set(false), 4000);
  }
}
