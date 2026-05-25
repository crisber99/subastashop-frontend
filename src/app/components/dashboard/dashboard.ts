import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdenService } from '../../services/orden';
import { CartService } from '../../services/cart';   
import { AuthService } from '../../services/auth-service';
import { PushNotificationService } from '../../services/push-notification.service';
import Swal from 'sweetalert2'; 
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  private productService = inject(ProductService);
  private ordenService = inject(OrdenService);
  public cartService = inject(CartService); 
  public authService = inject(AuthService);
  public pushService = inject(PushNotificationService);
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);

  pujas: any[] = [];
  ordenes: any[] = [];
  ordenesPendientes: any[] = [];
  ordenesPagadas: any[] = [];
  ordenesEnRevision: any[] = [];
  misConcursos: any[] = [];
  tabActual: string = 'carrito'; 

  stats = {
    usuarios: 0,
    ventas: 0,
    subastasActivas: 0,
    ingresos: 0,
    ventasPorDia: [] as any[],
    distribucionVentasPorTipo: [] as any[],
    topSellingProducts: [] as any[],
    pagosPendientesCount: 0
  };

  loading = false;

  // --- CONFIGURACIÓN DE GRÁFICOS 📊 ---
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } },
    scales: { 
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { grid: { display: false } }
    },
    plugins: { legend: { display: false } }
  };

  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Ingresos por Producto' }]
  };

  ngOnInit() {
    this.cargarDatos();

    if (this.cartService.items().length > 0) {
        this.verificarDisponibilidadCarrito();
    }

    this.activeRoute.queryParams.subscribe(params => {
        if (params['tab']) {
            this.tabActual = params['tab'];
        } else {
            // Lógica por defecto
            if (this.cartService.cantidadItems() > 0) {
              this.tabActual = 'carrito';
            } else {
              this.tabActual = 'compras';
            }
        }
    });
  }

  cargarDatos() {
    if (this.authService.isAdmin()) {
      this.productService.getAdminStats().subscribe({
        next: (data: any) => {
          this.stats = data;
          this.prepararGraficos();
        },
        error: (err) => console.error('Error stats:', err)
      });
    }

    this.productService.getMisPujas().subscribe(data => this.pujas = data);
    
    this.productService.getMisParticipaciones().subscribe({
      next: (data) => this.misConcursos = data,
      error: (err) => console.error('Error cargando concursos', err)
    });

    this.ordenService.getMisOrdenes().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.filtrarOrdenes();
      },
      error: (err) => console.error('Error cargando órdenes', err)
    });
  }

  filtrarOrdenes() {
    this.ordenesPendientes = this.ordenes.filter(o => o.estado === 'PENDIENTE_PAGO');
    this.ordenesPagadas = this.ordenes.filter(o => o.estado === 'PAGADO');
    this.ordenesEnRevision = this.ordenes.filter(o => o.estado === 'ESPERANDO_APROBACION');
  }

  procesarCompraCarrito() {
    if (this.cartService.cantidadItems() === 0) return;
    
    Swal.fire({
        title: '¿Finalizar Compra?',
        text: `Vas a generar una orden por ${this.cartService.cantidadItems()} productos.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sí, Comprar',
        confirmButtonColor: '#3085d6'
    }).then((result) => {
        if(result.isConfirmed) {
            this.ejecutarCompra();
        }
    });
  }

  ejecutarCompra() {
    this.loading = true;
    Swal.fire({title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});

    const detallesBackend = this.cartService.items().map(item => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      tipoCompra: item.tipo,
      datosExtra: item.extra ? String(item.extra) : null
    }));

    const request = { detalles: detallesBackend };

    this.ordenService.crearOrden(request).subscribe({
      next: (orden) => {
        this.loading = false;
        
        Swal.fire({
            icon: 'success',
            title: '¡Orden Creada!',
            text: 'Revisa la pestaña "Mis Compras" para ver el detalle.',
            timer: 2000
        });

        this.cartService.limpiarCarrito(); 
        this.cargarDatos();                
        this.tabActual = 'compras';        
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err.error || 'No se pudo procesar la compra.', 'error');
      }
    });
  }

  verificarDisponibilidadCarrito() {
    const items = this.cartService.items();
    items.forEach(item => {
        if (item.tipo === 'DIRECTA') {
            this.productService.getProductoById(item.producto.id).subscribe({
                next: (prodActualizado) => {
                    if (prodActualizado.estado !== 'DISPONIBLE') {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Producto Agotado',
                            text: `El producto "${prodActualizado.nombre}" ya no está disponible. Fue eliminado del carrito.`,
                            toast: true,
                            position: 'top-end',
                            timer: 5000
                        });
                        this.cartService.eliminarItemPorId(prodActualizado.id);
                    }
                },
                error: (err) => console.error("Error verificando stock", err)
            });
        }
    });
  }

  cambiarTab(tab: string) {
    this.tabActual = tab; 
    if (tab === 'carrito') {
        this.verificarDisponibilidadCarrito();
    } 
    else if (tab === 'compras') {
        this.recargarOrdenes();
    }
    else if (tab === 'pujas') {
        this.recargarPujas();
    }
  }

  recargarOrdenes() {
    this.loading = true; 
    
    this.productService.getMisParticipaciones().subscribe(data => this.misConcursos = data);

    this.ordenService.getMisOrdenes().subscribe({
        next: (data) => {
            this.ordenes = data;
            this.filtrarOrdenes();
            this.loading = false;
        },
        error: (err) => {
            console.error(err);
            this.loading = false;
        }
    });
  }

  recargarPujas() {
      this.productService.getMisPujas().subscribe(data => this.pujas = data);
  }

  cancelarOrden(ordenId: number) {
    Swal.fire({
      title: '¿Cancelar esta orden?',
      text: 'Los productos reservados quedarán disponibles nuevamente. Se te enviará una confirmación por correo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar orden',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Cancelando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        this.ordenService.cancelarOrden(ordenId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Orden Cancelada',
              text: 'Te hemos enviado una confirmación por correo.',
              timer: 3000,
              showConfirmButton: false
            });
            this.recargarOrdenes();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.error || 'No se pudo cancelar la orden.', 'error');
          }
        });
      }
    });
  }

  abrirCajaMisteriosa(detalle: any) {
    Swal.fire({
      title: '¡Preparando tu Caja Misteriosa!',
      text: 'La suerte está echada...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.productService.getProductoById(detalle.producto.id).subscribe({
      next: (productoCompleto: any) => {
        const premiosPosibles = productoCompleto.premios || [];
        
        this.ordenService.abrirCaja(detalle.id).subscribe({
          next: (res: any) => {
            const premioText = res.premio || "Un premio misterioso";

            if (premiosPosibles.length === 0) {
              this.animacionBasica(premioText);
              return;
            }

            this.animacionRuletaMarioKart(premiosPosibles, premioText);
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', err.error || 'No se pudo abrir la caja.', 'error');
          }
        });
      },
      error: () => {
         // Fallback si falla la obtención del producto
         this.ordenService.abrirCaja(detalle.id).subscribe({
           next: (res: any) => this.animacionBasica(res.premio || "Un premio misterioso"),
           error: (err) => Swal.fire('Error', err.error || 'No se pudo abrir la caja.', 'error')
         });
      }
    });
  }

  animacionBasica(premioText: string) {
    Swal.fire({
      title: '📦 Abriendo Caja...',
      html: `<div class="lootbox-animation">
               <div class="box-shaking" style="font-size: 5rem; animation: shake 0.5s infinite;">🎁</div>
               <p class="mt-3 text-muted">Averiguando qué hay dentro...</p>
             </div>`,
      showConfirmButton: false,
      allowOutsideClick: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: () => {
         const style = document.createElement('style');
         style.innerHTML = `
           @keyframes shake {
             0% { transform: translate(1px, 1px) rotate(0deg); }
             10% { transform: translate(-1px, -2px) rotate(-1deg); }
             20% { transform: translate(-3px, 0px) rotate(1deg); }
             30% { transform: translate(3px, 2px) rotate(0deg); }
             40% { transform: translate(1px, -1px) rotate(1deg); }
             50% { transform: translate(-1px, 2px) rotate(-1deg); }
             60% { transform: translate(-3px, 1px) rotate(0deg); }
             70% { transform: translate(3px, 1px) rotate(-1deg); }
             80% { transform: translate(-1px, -1px) rotate(1deg); }
             90% { transform: translate(1px, 2px) rotate(0deg); }
             100% { transform: translate(1px, -2px) rotate(-1deg); }
           }
         `;
         document.head.appendChild(style);
      }
    }).then(() => {
      Swal.fire({
        title: '¡Felicidades!',
        html: `<h3>Has ganado:</h3><br><h2 class="text-success fw-bold animate__animated animate__tada">${premioText}</h2>`,
        icon: 'success',
        confirmButtonText: '¡Genial!',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        this.cargarDatos(); 
      });
    });
  }

  animacionRuletaMarioKart(premios: any[], premioGanadoText: string) {
    const premioGanado = premios.find(p => p.nombre.toLowerCase() === premioGanadoText.toLowerCase());
    const imgGanador = premioGanado?.imagenUrl || '';

    Swal.fire({
      title: '🎁 Abriendo Caja Misteriosa...',
      html: `
        <div class="mario-kart-box">
           <div id="roulette-item" class="roulette-item shadow-lg">
              <i class="bi bi-question-lg" style="font-size: 5rem;"></i>
           </div>
           <p id="roulette-name" class="mt-3 fw-bold fs-4 text-muted">¿Qué será?</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        const itemDiv = document.getElementById('roulette-item');
        const nameText = document.getElementById('roulette-name');
        
        const style = document.createElement('style');
        style.innerHTML = `
          .mario-kart-box {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
          }
          .roulette-item {
            width: 150px; height: 150px; 
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            color: white;
            transition: all 0.1s;
            border: 4px solid #fff;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          }
          .roulette-item img {
            max-width: 120px; max-height: 120px; object-fit: contain; border-radius: 10px;
          }
          .roulette-spin {
             transform: scale(1.1);
          }
        `;
        document.head.appendChild(style);

        let i = 0;
        let speed = 50; 
        let ticks = 0;
        
        const spin = () => {
           ticks++;
           const p = premios[i % premios.length];
           if(itemDiv && nameText) {
               itemDiv.innerHTML = p.imagenUrl ? `<img src="${p.imagenUrl}">` : `<i class="bi bi-gift" style="font-size: 4rem; color: white;"></i>`;
               nameText.innerText = p.nombre;
               itemDiv.classList.add('roulette-spin');
               setTimeout(() => itemDiv.classList.remove('roulette-spin'), speed / 2);
           }
           i++;
           
           if(ticks > 30) { speed += 25; } 
           
           if(speed < 350) {
              setTimeout(spin, speed);
           } else {
              setTimeout(() => {
                 if(itemDiv && nameText) {
                     itemDiv.innerHTML = imgGanador ? `<img src="${imgGanador}">` : `<i class="bi bi-star-fill text-warning" style="font-size: 4rem;"></i>`;
                     nameText.innerText = premioGanadoText;
                     itemDiv.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                     itemDiv.classList.add('animate__animated', 'animate__tada');
                     nameText.classList.remove('text-muted');
                     nameText.classList.add('text-success', 'animate__animated', 'animate__bounceIn');
                 }
                 setTimeout(() => {
                    Swal.fire({
                      title: '¡Felicidades!',
                      html: `<h3>Has ganado:</h3><br><h2 class="text-success fw-bold animate__animated animate__tada">${premioGanadoText}</h2>`,
                      icon: 'success',
                      confirmButtonText: '¡Genial!',
                      confirmButtonColor: '#3085d6'
                    }).then(() => this.cargarDatos());
                 }, 1500);
              }, 500);
           }
        };
        setTimeout(spin, speed);
      }
    });
  }

  // --- LÓGICA DE PROCESAMIENTO DE GRÁFICOS 📈 ---
  prepararGraficos() {
    // 1. Gráfico de Líneas (Ventas por Día)
    if (this.stats.ventasPorDia && this.stats.ventasPorDia.length > 0) {
      this.lineChartData = {
        labels: this.stats.ventasPorDia.map((v: any) => new Date(v[0]).toLocaleDateString()),
        datasets: [{
          data: this.stats.ventasPorDia.map((v: any) => v[1]),
          label: 'Ventas ($)',
          fill: true,
          borderColor: '#6f42c1',
          backgroundColor: 'rgba(111, 66, 193, 0.2)',
          pointBackgroundColor: '#6f42c1',
          pointBorderColor: '#fff',
        }]
      };
    }

    // 2. Gráfico de Pie (Distribución por Tipo)
    if (this.stats.distribucionVentasPorTipo && this.stats.distribucionVentasPorTipo.length > 0) {
      this.pieChartData = {
        labels: this.stats.distribucionVentasPorTipo.map((t: any) => t[0] === 'RIFA' ? 'CONCURSO' : t[0]),
        datasets: [{
          data: this.stats.distribucionVentasPorTipo.map((t: any) => t[1]),
          backgroundColor: ['#0d6efd', '#fd7e14', '#198754', '#6610f2']
        }]
      };
    }

    // 3. Gráfico de Barras (Top Productos)
    if (this.stats.topSellingProducts && this.stats.topSellingProducts.length > 0) {
      this.barChartData = {
        labels: this.stats.topSellingProducts.map((p: any) => p[0]),
        datasets: [{
          data: this.stats.topSellingProducts.map((p: any) => p[1]),
          label: 'Ingresos Totales ($)',
          backgroundColor: '#0dcaf0',
          borderRadius: 8
        }]
      };
    }
  }
}
