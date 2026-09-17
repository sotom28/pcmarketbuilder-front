import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/services/cart.service';
import { TermsModal } from '../terms-modal/terms-modal';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, TermsModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  readonly showTerms = signal(false);

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
  ) {}

  login(): void {
    this.auth.login();
  }

  /** "Registrarse" muestra los T&C antes del primer login; "Iniciar sesión" va directo. */
  register(): void {
    this.showTerms.set(true);
  }

  onTermsAccepted(): void {
    this.showTerms.set(false);
    this.auth.login();
  }

  onTermsCancelled(): void {
    this.showTerms.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
