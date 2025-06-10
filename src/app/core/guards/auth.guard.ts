import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }

  private checkAuth(url: string): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (user) {
          // Check if user is active
          if (!user.isActive) {
            this.authService.logout();
            alert('Your account has been deactivated by an administrator.');
            return false;
          }
          return true;
        } else {
          this.router.navigate(['/auth/signin'], {
            queryParams: { returnUrl: url },
          });
          return false;
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredRole = route.data['role'] as
      | 'job-seeker'
      | 'company'
      | 'admin';
    const requiredRoles = route.data['roles'] as string[];

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/auth/signin']);
          return false;
        }

        // Check if user is active
        if (!user.isActive) {
          this.authService.logout();
          alert('Your account has been deactivated by an administrator.');
          return false;
        }

        // Check single role
        if (requiredRole && user.role !== requiredRole) {
          this.redirectBasedOnRole(user.role);
          return false;
        }

        // Check multiple roles
        if (requiredRoles && !requiredRoles.includes(user.role)) {
          this.redirectBasedOnRole(user.role);
          return false;
        }

        return true;
      })
    );
  }

  private redirectBasedOnRole(userRole: string): void {
    if (userRole === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (userRole === 'company') {
      this.router.navigate(['/profile']); // Company users go to profile page
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          const user = this.authService.getCurrentUser();
          if (user?.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (user?.role === 'company') {
            this.router.navigate(['/profile']); // Company users go to profile page
          } else {
            this.router.navigate(['/dashboard']);
          }
          return false;
        }
        return true;
      })
    );
  }
}
