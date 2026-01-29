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

export const routes: Routes = [
    // 1. LA RAÍZ: Ahora carga la Landing Page (Buscador de tiendas)
    { path: '', component: Landing },

    // 2. LA TIENDA ESPECÍFICA: Carga el Catálogo, pero filtrado (lo haremos en el paso 2)
    { path: 'tienda/:slug', component: CatalogComponent },

    // 3. RUTA OPCIONAL: Si quieres ver "todo mezclado" sin filtro
    { path: 'catalogo-global', component: CatalogComponent },

    // ... Resto de tus rutas (sin cambios)
    { path: 'producto/:id', component: ProductDetail },
    { path: 'login', component: LoginComponent },
    { path: 'mi-cuenta', component: Dashboard },
    { path: 'admin/crear', component: CrearProducto },
    { path: 'checkout/:id', component: Checkout },
    { path: 'admin', component: AdminDashboard, canActivate: [authGuard] },
    { path: 'registro', component: Register },
    { path: 'admin/editar/:id', component: EditarProducto, canActivate: [authGuard] },
    {
        path: 'super-admin',
        component: SuperAdminTiendas,
        canActivate: [authGuard]
    },
    { path: 'super-admin/reportes', component: SuperAdminReportes, canActivate: [authGuard] },
    {
        path: 'admin/configuracion',
        component: AdminConfig,
        canActivate: [authGuard]
    },
    // Redirección por defecto
    { path: '**', redirectTo: '' }
];