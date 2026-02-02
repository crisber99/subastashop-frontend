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
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
    // ==========================================
    // 1. RUTAS PÚBLICAS (Accesibles para todos)
    // ==========================================
    // No llevan Sidebar de Admin, ni AuthGuard.
    { path: '', component: Landing },
    { path: 'login', component: LoginComponent },      // 👈 ¡Ahora está fuera del Guard!
    { path: 'registro', component: Register },         // 👈 ¡Ahora está fuera del Guard!
    
    // El catálogo y productos suelen ser públicos (para que compren sin loguearse primero)
    { path: 'tienda/:slug', component: CatalogComponent },
    { path: 'catalogo-global', component: CatalogComponent },
    { path: 'producto/:id', component: ProductDetail },

    // ==========================================
    // 2. RUTAS PRIVADAS (Panel de Control)
    // ==========================================
    // Estas SÍ llevan Sidebar y Protección
    {
        path: '',
        component: MainLayout, // El esqueleto con Sidebar y Navbar
        canActivate: [authGuard], // 🔒 Candado de seguridad
        children: [
            // Dashboard del Usuario
            { path: 'dashboard', component: Dashboard }, // Ojo: antes lo tenías como 'mi-cuenta'
            { path: 'mi-cuenta', redirectTo: 'dashboard', pathMatch: 'full' }, // Redirección por compatibilidad

            // Proceso de Compra (Checkout)
            { path: 'checkout/:id', component: Checkout },

            // Administración de Tienda
            { path: 'admin', component: AdminDashboard },
            { path: 'admin/crear', component: CrearProducto },
            { path: 'admin/editar/:id', component: EditarProducto },
            { path: 'admin/configuracion', component: AdminConfig },

            // Súper Admin
            { path: 'super-admin', component: SuperAdminTiendas },
            { path: 'super-admin/reportes', component: SuperAdminReportes },
            { path: 'super-admin/usuarios', component: AdminUsersComponent },
        ]
    },

    // 3. Comodín para errores 404
    { path: '**', redirectTo: '' }
];