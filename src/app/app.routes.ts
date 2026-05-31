import { Routes } from '@angular/router';
import { CatalogComponent } from './components/catalog/catalog';
import { ProductDetail } from './components/product-detail/product-detail';
import { LoginComponent } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { CrearProducto } from './components/admin/crear-producto/crear-producto';
import { Checkout } from './components/checkout/checkout';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { authGuard } from './guards/auth-guard';
import { Register } from './components/register/register';
import { EditarProducto } from './components/admin/editar-producto/editar-producto';
import { Landing } from './pages/landing/landing';
import { SuperAdminDashboard } from './pages/super-admin-dashboard/super-admin-dashboard';
import { SuperAdminReportes } from './pages/super-admin-reportes/super-admin-reportes';
import { AdminConfig } from './pages/admin-config/admin-config';
import { AdminUsersComponent } from './components/admin-users-component/admin-users-component';
import { SupportComponent } from './components/support/support';
import { MisFavoritosComponent } from './pages/mis-favoritos/mis-favoritos.component';
import { PrivacidadComponent } from './pages/privacidad/privacidad.component';
import { TerminosComponent } from './pages/terminos/terminos.component';
import { ProfileComponent } from './components/profile/profile';
import { AdminDataAnalysisComponent } from './components/admin/admin-data-analysis/admin-data-analysis.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';

export const routes: Routes = [
    // Rutes Públiques
    { path: '', component: Landing },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: Register },
    { path: 'tienda/:slug', component: CatalogComponent },
    { path: 'catalogo-global', component: CatalogComponent },
    { path: 'producto/:slug', component: ProductDetail },
    { path: 'privacidad', component: PrivacidadComponent },
    { path: 'terminos', component: TerminosComponent },
    { path: 'como-funciona', component: HowItWorksComponent },

    // Rutes Privades (Protegides per el AuthGuard)
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'mis-favoritos', component: MisFavoritosComponent, canActivate: [authGuard] },
    { path: 'mi-cuenta', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'checkout/:id', component: Checkout, canActivate: [authGuard] },
    { path: 'admin', component: AdminDashboard, canActivate: [authGuard] },
    { path: 'admin/crear', component: CrearProducto, canActivate: [authGuard] },
    { path: 'admin/editar/:id', component: EditarProducto, canActivate: [authGuard] },
    { path: 'admin/configuracion', component: AdminConfig, canActivate: [authGuard] },
    { path: 'admin/analisis-ia', component: AdminDataAnalysisComponent, canActivate: [authGuard] },
    { path: 'super-admin', component: SuperAdminDashboard, canActivate: [authGuard] },
    { path: 'super-admin/reportes', component: SuperAdminReportes, canActivate: [authGuard] },
    { path: 'super-admin/usuarios', component: AdminUsersComponent, canActivate: [authGuard] },
    { path: 'soporte', component: SupportComponent, canActivate: [authGuard] },

    // Comodín
    { path: '**', redirectTo: '' }
];
