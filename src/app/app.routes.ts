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
import { SuperAdminTiendas } from './pages/super-admin-tiendas/super-admin-tiendas';
import { SuperAdminReportes } from './pages/super-admin-reportes/super-admin-reportes';
import { AdminConfig } from './pages/admin-config/admin-config';
import { AdminUsersComponent } from './components/admin-users-component/admin-users-component';

export const routes: Routes = [
    // Rutes Públiques
    { path: '', component: Landing },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: Register },
    { path: 'tienda/:slug', component: CatalogComponent },
    { path: 'catalogo-global', component: CatalogComponent },
    { path: 'producto/:id', component: ProductDetail },

    // Rutes Privades (Protegides per el AuthGuard)
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'mi-cuenta', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'checkout/:id', component: Checkout, canActivate: [authGuard] },
    { path: 'admin', component: AdminDashboard, canActivate: [authGuard] },
    { path: 'admin/crear', component: CrearProducto, canActivate: [authGuard] },
    { path: 'admin/editar/:id', component: EditarProducto, canActivate: [authGuard] },
    { path: 'admin/configuracion', component: AdminConfig, canActivate: [authGuard] },
    { path: 'super-admin', component: SuperAdminTiendas, canActivate: [authGuard] },
    { path: 'super-admin/reportes', component: SuperAdminReportes, canActivate: [authGuard] },
    { path: 'super-admin/usuarios', component: AdminUsersComponent, canActivate: [authGuard] },

    // Comodín
    { path: '**', redirectTo: '' }
];