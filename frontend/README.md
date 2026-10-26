# Frontend

La app que usan jugadores y entrenadores: React + TypeScript + Vite, estilos con Tailwind y PWA instalable con service worker (vite-plugin-pwa).

## Comandos

Se pueden lanzar desde esta carpeta o desde la raíz del repo.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | `tsc` (comprobación de tipos) + build de producción en `dist/`. Tiene que pasar antes de cada commit |
| `npm run preview` | Sirve `dist/` para probar la instalación y el modo sin conexión |

## Variables de entorno

Se leen de `.env.local`, que no se sube a git. La plantilla está en `.env.example`.

| Variable | Qué es |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publicable (`sb_publishable_…`). Es pública por diseño: los datos los protege RLS en el backend |

## Estructura

```
frontend/
├── index.html            Página base; React se monta en <div id="root">
├── vite.config.ts        Vite, Tailwind, alias @/ y configuración de la PWA
├── public/               Iconos y ficheros que se sirven tal cual
└── src/
    ├── main.tsx          Punto de entrada: monta <App />
    ├── index.css         Carga Tailwind
    ├── core/             Infraestructura común (ver core/README.md)
    ├── modules/          Una carpeta por funcionalidad (ver modules/README.md)
    └── shared/           Piezas reutilizables sin lógica de negocio propia (ver shared/README.md)
```

## Cómo arranca la app

```
main.tsx
  └─ App (core/App.tsx)
       └─ AuthProvider            restaura la sesión guardada en el móvil
            └─ AuthGate           ¿hay sesión?
                 ├─ no → LoginPage
                 └─ sí → SessionProvider (rol en el equipo)
                          └─ Router
                               └─ AppLayout (cabecera + menú inferior)
                                    └─ pantalla del módulo, protegida por ModuleGuard
```

`ModuleGuard` solo deja ver una pantalla si el módulo está activado en el equipo y el rol del usuario llega al mínimo que pide el módulo.

## Reglas de dependencias

- `modules/<x>` puede importar de `core/` y `shared/`, **nunca de otro módulo**.
- `shared/` no importa de `core/` ni de `modules/`.
- `core/` solo conoce los módulos a través de `core/modules/registry.ts`.

Así se puede activar, desactivar o borrar un módulo sin romper el resto.

## Convenciones

- Código, comentarios y nombres en inglés. Todo texto visible en pantalla en español.
- Valores de dominio en inglés (`setter`, `coach`…); su etiqueta en español vive en `shared/domain/labels.ts`.
- Cada fichero empieza con un comentario que explica para qué sirve. Las props y funciones exportadas que no se entienden por su nombre llevan un comentario `/** … */`.
- Componentes pequeños: una página orquesta el estado y delega cada bloque visual en un componente de `components/`.
- Móvil primero: botones grandes y como máximo dos toques para las acciones de jugador.
- Imports con el alias `@/` (apunta a `src/`).
