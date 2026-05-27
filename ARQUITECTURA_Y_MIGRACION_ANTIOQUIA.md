# Documento Maestro de Arquitectura, Defensa y Migración
## Proyecto Aplicativo - Gobernación de Antioquia

**Fecha de Generación:** Abril 2026
**Estado del Proyecto:** En Desarrollo Activo (Google AI Studio)

---

## 1. Introducción y Propósito del Documento
Este documento técnico y estratégico tiene como objetivo detallar, justificar y proyectar la arquitectura de software actual del aplicativo en desarrollo para la **Gobernación de Antioquia**. Dado que este desarrollo debe contar con un soporte documental exhaustivo, este informe desglosa la arquitectura "unificada" (Full-Stack en un único repositorio) actualmente alojada en el entorno de Google AI Studio, detalla las tecnologías operativas, formula una defensa robusta de las decisiones arquitectónicas iniciales (incluyendo seguridad y agilidad) y establece una ruta clara para una eventual migración hacia una arquitectura tradicional desacoplada, en caso de ser requerido por las políticas de TI gubernamentales.

---

## 2. Definición y Análisis de la Arquitectura Actual
Actualmente, el sistema opera bajo una **Arquitectura Full-Stack Unificada (Monorepo con Backend Integrado)** gestionada mediante un servidor de Node.js. A menudo a esta aproximación se le atribuyen características "isomórficas" en el sentido de que un mismo entorno (el repositorio) maneja la lógica de presentación y la lógica de negocio/datos, y comparten el mismo lenguaje subyacente (TypeScript).

En producción, un servidor base entrañando ambas facetas arranca, exponiendo por un lado las rutas de API y por el otro sirviendo los archivos estáticos pre-compilados del Frontend.

### Ecosistema Tecnológico de Base:
El aplicativo cuenta con una base de tecnologías modernas y altamente sostenibles:

*   **Lenguaje Base:** `TypeScript` (v5.8). Tipado estricto extremo a extremo, lo cual previene errores en tiempo de ejecución, una cualidad vital para aplicaciones gubernamentales.
*   **Backend (Servidor de Aplicaciones):** `Node.js` ejecutando el framework `Express.js` (v5.x). Es un estándar industrial veloz, probado y muy maduro. 
*   **Capa de Datos y ORM:** `Prisma` (v7.6). Actúa como la capa de abstracción de bases de datos. Prisma genera clientes tipados basados en un esquema riguroso (`schema.prisma`), protegiendo la base de datos de inyecciones SQL y garantizando predictibilidad de datos.
*   **Motor Frontend (UI):** `React` (v19) soportado por `Vite` (v6) como empaquetador ultrarrápido. Proporciona una interfaz reactiva e interacciones de usuario en tiempo real.
*   **Estilos y Componentes:** `Tailwind CSS` (v4) para un diseño de sistema escalable y mantenible.
*   **Transiciones y Visuales:** `Motion` para animaciones y `Recharts` para las proyecciones visuales de datos y reportes dentro de los distintos módulos (Módulo de captura, reportes, etc).
*   **Empaquetador de Servidor:** `Esbuild`. Permite que el servidor Express desarrollado en TypeScript sea transpilado rápidamente a código nativo de Node (CommonJS) para producción.

---

## 3. Despliegue y Ejecución en Máquinas Virtuales (VM)
Para alojar esta arquitectura en las instalaciones (On-Premise) de la Gobernación o en Nubes privadas (IaaS) mediante Máquinas Virtuales (Linux, preferiblemente Ubuntu/Debian o RHEL), se requieren los siguientes elementos en la infraestructura:

1.  **Node.js Runtime:** Instalación de Node.js (se recomienda la versión LTS actual, v22+) en el sistema operativo huésped.
2.  **Gestor de Procesos (PM2 o Systemd):** Dado que la aplicación arranca con el comando `node dist/server.cjs`, se necesita una herramienta como **PM2** para mantener la aplicación viva, reiniciarla en caso de fallos del sistema o caídas de instancia, y gestionar los logs de auditoría estandarizados. Alternativamente, crear un demonio de `systemd`.
3.  **Servidor Web Inverso (Reverse Proxy):** Se DEBE instalar **Nginx** o **Apache**. Nginx recibirá el tráfico de los ciudadanos o funcionarios por los puertos 80 (HTTP) y 443 (HTTPS), gestionará los certificados de seguridad (SSL/TLS) y redirigirá ese tráfico (Proxy Pass) internamente al puerto (ej: 3000) en el que corre el servidor de Node.js.
4.  **Motor de Base de Datos Subyacente:** Un clúster o máquina dedicada para la base de datos relacional elegida (PostgreSQL recomendado por rendimiento e integridad de datos geográficos/estructurales). Prisma se conectará enviando sus consultas a esta VM.
5.  **Cortafuegos (UFW / iptables):** Configuración de un firewall estricto donde solo los puertos 80/443 de Nginx y el 22 (SSH para administración) estén abiertos hacia el exterior. El puerto interno de Node.js permanecerá inaccesible desde el mundo real.

---

## 4. Defensa de la Arquitectura Unificada (¿Cómo "venderla"?)
*A menudo en entornos corporativos o gubernamentales existe el sesgo de que "todo debe estar estrictamente separado en repositorios distintos desde el inicio". A continuación, se detalla por qué la arquitectura actual NO es algo perjudicial, sino una decisión altamente inteligente, ágil y perfectamente segura para esta fase técnica y las subsecuentes.*

### 4.1. Eficiencia, Agilidad y Reducción de Costos de Infraestructura
La principal fortaleza de este enfoque radica en la simplicidad operativa ("Agilidad Operacional"). Al estar unificadas bajo el mismo paraguas en su arranque:
*   **Menos Servidores que Mantener:** No se requiere provisionar, monitorizar ni escalar VM independientes para el "Frontend App" y el "Backend API". Con un solo despliegue, el sistema arranca. 
*   **Velocidad de Iteración Exponencial:** Los tipos de TypeScript ("Contratos de Datos") generados en el dominio (`src/domain/models/types.ts` o Prisma) se comparten instantáneamente entre el API Backend (`src/presentation/api/routes.ts`) y la Interfaz React (`src/presentation/pages/...`). Esto anula los tiempos muertos de integración, bajando los costos directos de horas/hombre en desarrollo.

### 4.2. Percepción de Seguridad vs. Realidad Arquitectónica
*¿La arquitectura actual expone mis datos o mi código del servidor por estar todo en la misma estructura de archivos?* **NO.**

Para vender este modelo se debe ser enfático en lo siguiente:
Aunque el código convive en el mismo proyecto para el equipo de desarrollo, el proceso de compilación (`npm run build`) realiza un **corte transversal profundo y absoluto**:
1.  **Vite** toma únicamente la carpeta `src/presentation` enfocada en IU y empaqueta puro HTML, CSS y JavaScript minificado en la carpeta `/dist/client`. Todo el código servidor/secreto es ignorado y eliminado de esta compilación.
2.  **Esbuild** toma la lógica privada (`server.ts`, rutas API, operaciones de base de datos) y construye un archivo de servidor cifrado en el backend (`dist/server.cjs`).
El navegador de los usuarios de Antioquia JAMÁS descarga ni sabe de la existencia de Prisma, del backend, o de las variables de entorno. 

### 4.3. Nivel de Criticidad de la Data y Justificación Temporal
Si el aplicativo va a manejar inicialmente registros estructurales, capturas de tiempos o jerarquías para la fase actual (como se vislumbra en el **Módulo de Captura**), una arquitectura unificada no compromete el dato transaccional. La validación sigue ocurriendo en el lado del servidor, protegido por los middlewares de Express y las garantías del ORM Prisma. 

Se puede argumentar contundentemente que: *"Elegimos mantener la aplicación cohesionada en sus albores para maximizar el ritmo de entregas modulares, asegurar contratos de datos estrictos en tiempo real, y rebajar a la mitad las facturas operativas y de despliegue inicial en servidores virtualizados de la Gobernación, manteniendo el blindaje del servidor sobre la lógica sensible"*.

---

## 5. Estrategia y Capacidad de Migración a Arquitectura Desacoplada (Tradicional)
*¿Existe una ruta técnica en caso de obligatoriedad institucional para migrar hacia una Arquitectura Clásica (Frontend servido en local/GCP Storage/S3 y Backend API aislado en una VM)?*

**La respuesta es un SÍ rotundo.**
La arquitectura en Google AI Studio ha sido diseñada de manera modular, con carpetas conceptualmente orientadas al *Domain Driven Design* (DDD) (`application/`, `domain/`, `infrastructure/`, `presentation/`). Separar esto es un proceso determinista y de bajo riesgo arquitectónico.

### Fases de Migración (De AI Studio a Entorno Desacoplado):

1.  **Extracción de Repositorios (Bifurcación):**
    *   Se toman todos los archivos de Google AI Studio y el código se duplica en dos repositorios de Git: `antioquia-frontend` y `antioquia-backend`.
2.  **Adecuación del Repositorio Backend (API):**
    *   **Limpieza:** Se elimina React, Vite y las carpetas de `src/presentation/components` y `pages`.
    *   **CORS (Cross-Origin Resource Sharing):** Al estar separados en distintos servidores/dominios (ej. `app.antioquia.gov.co` y `api.antioquia.gov.co`), el `server.ts` se modificará añadiendo el middleware de `cors` en Express, autorizando exclusivamente al dominio del frontend público para enviar peticiones.
    *   **Despliegue:** Se instala en la VM de Linux interna como una simple API REST.
3.  **Adecuación del Repositorio Frontend (Cliente SPA):**
    *   **Limpieza:** Se eliminan dependencias del backend: `express`, `@prisma/client`, carpetas de `src/infrastructure` y `server.ts`.
    *   **Gestión de Endpoints:** El servicio `apiClient.ts` ya no apuntará a `/api/X`, sino que se usará `VITE_API_URL` (variables de entorno públicas) apuntando a `https://api.antioquia.gov.co/api/...`.
    *   **Despliegue:** Se ejecuta un simple `vite build`. La carpeta de estáticos resultante se puede ingresar rápidamente a la carpeta `/var/www/html` de un servidor **Nginx puro**, o un **Apache**, o simplemente cualquier servicio estático en la red (Azure Static Web Apps, AWS S3/CloudFront).

**Ventajas Post-Migración:** Esta separación a futuro es ideal cuando el Frontend requiera balanceadores de carga independientes del tráfico que tengan los procesos intensos de la base de datos (Backend), permitiendo escalar un equipo solo dedicado al React (ciudadano) y otro solo dedicado al Express/SQL (infraestructura).

---

## 6. Consideraciones de Evolución Actual (Módulo de Captura)
El sistema está provisto para evolucionar en Google AI Studio. 

Respecto al desarrollo futuro y las mejoras mencionadas directamente sobre el **Módulo de Captura** (`CapturaModule.tsx`, `TimeCapture.tsx`):
*   La arquitectura vigente es **suficiente y sobrada** para estas mejoras. Aumentar robustez en los registros, generar nuevas validaciones documentales cruzadas, o agregar nuevas tablas relacionales en `schema.prisma` para nutrir la interfaz de "Captura", **no implica ni demanda agregar más tecnologías externas o subir la complejidad del ecosistema**.
*   Las bibliotecas instaladas (React, Tailwind, Prisma) son de categoría "Enterprise". Añadir un submódulo de registros solo implica extender los archivos en `src/presentation/components/Captura/` y crear nuevos controladores en el `server.ts`. El flujo subyacente mantendrá la alta escalabilidad sin incurrir en deuda técnica de arquitectura "spaghetti".

---
*Este modelo asegura la viabilidad actual y futura del producto, blindando la de la gobernación de Antioquia ante cambios institucionales con rutas trazadas de desacople sin afectar el código que ya haya sido consolidado.*
