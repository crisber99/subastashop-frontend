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

export const routes: Routes = [
    { path: '', component: CatalogComponent },
    { path: 'producto/:id', component: ProductDetail },
    { path: 'login', component: LoginComponent },
    { path: 'mi-cuenta', component: Dashboard },
    { path: 'admin/crear', component: CrearProducto },
    { path: 'checkout/:id', component: Checkout },
    {
        path: 'admin',
        component: AdminDashboard,
        canActivate: [authGuard] // ¡Importante protegerla!
        // Idealmente crearías un adminGuard que verifique el rol
    },
    { path: 'registro', component: Register },
];