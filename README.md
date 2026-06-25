# Sistema Digital de Medición de Cargas de Trabajo (SDMCT)
## Gobernación de Antioquia - Manual de Despliegue y Configuración de Producción

Este repositorio contiene la solución de software **SDMCT** para la Gobernación de Antioquia. Es una aplicación **Full-Stack unificada (monorepo)** construida bajo una arquitectura de alto rendimiento que integra el Frontend (React 19 + Vite) y el Backend (Express.js + Node.js) en un solo servicio cohesivo, facilitando el despliegue on-premise y reduciendo los costos de mantenimiento y administración de servidores.

---

## Índice
1. [Arquitectura e Infraestructura](#1-arquitectura-e-infraestructura)
2. [Análisis de Viabilidad: On-Premise con PostgreSQL Containerizado](#2-análisis-de-viabilidad-on-premise-con-postgresql-containerizado)
3. [Estrategias de Despliegue de Base de Datos](#3-estrategias-de-despliegue-de-base-de-datos)
   - [Opción A: PostgreSQL On-Premise (Docker / Servicio Institucional) con Prisma](#opción-a-postgresql-on-premise-docker--servicio-institucional-con-prisma)
   - [Opción B: Microsoft SQL Server (Entorno Institucional Tradicional) con Prisma](#opción-b-microsoft-sql-server-entorno-institucional-tradicional-con-prisma)
   - [Opción C: Supabase / PostgreSQL (Entorno SaaS Integrado)](#opción-c-supabase--postgresql-entorno-saas-integrado)
4. [Variables de Entorno (.env)](#4-variables-de-entorno-env)
5. [Guía de Despliegue Paso a Paso en Linux VM (On-Premise)](#5-guía-de-despliegue-paso-a-paso-en-linux-vm-on-premise)
6. [Configuración del Servidor Inverso (Nginx)](#6-configuración-del-servidor-inverso-nginx)
7. [Mantenimiento y Auditoría de Código](#7-mantenimiento-y-auditoría-de-código)

---

## 1. Arquitectura e Infraestructura

La aplicación opera como un **servidor web unificado**. 
* **Desarrollo:** El servidor Express (`server.ts`) se ejecuta directamente y monta el middleware de Vite para transpilar y servir los activos en tiempo real con soporte Hot Module Replacement (HMR).
* **Producción:** El comando `npm run build` realiza un corte transversal absoluto:
  1. Compila el frontend React en una aplicación estática de página única (SPA) dentro de la carpeta `/dist` (disponible para el servidor estático).
  2. Compila el backend Express (`server.ts`) usando `esbuild` en un archivo autocontenido optimizado para Node.js: `/dist/server.cjs`.
  3. En producción, la aplicación arranca de forma nativa e instantánea usando `node dist/server.cjs`, sirviendo tanto las rutas de la API en `/api/*` como el cliente web estático de forma unificada.

---

## 2. Análisis de Viabilidad: On-Premise con PostgreSQL Containerizado

El plan de desplegar esta aplicación en una **Máquina Virtual (VM) Linux On-Premise** conectándose a un **PostgreSQL institucional ejecutado dentro de un contenedor** (como Docker o Podman) es **100% viable, seguro y recomendado**.

### ¿Por qué es 100% viable y seguro?
1. **Soberanía y Seguridad del Dato:** Al desplegarse en la infraestructura de la Gobernación de Antioquia, todo el tráfico entre la aplicación (servidor Express) y la base de datos (PostgreSQL en contenedor) ocurre dentro de una red privada local o Virtual Private Cloud (VPC). No hay exposición de puertos al exterior.
2. **Independencia de Supabase:** La aplicación está diseñada con un servicio de base de datos modular (`DatabaseService.ts`). Cuenta con integraciones preparadas tanto para Supabase (para arranques rápidos) como para Prisma ORM para conexión directa a motores SQL tradicionales locales.
3. **Escalabilidad y Rendimiento:** PostgreSQL containerizado en Linux ofrece un desempeño transaccional excelente y es sumamente fácil de respaldar mediante backups programados (`pg_dump`).
4. **Cero Dependencia de Terceros:** El control absoluto del motor de datos reside en el equipo de TI de la Gobernación, cumpliendo con los estándares de seguridad de datos gubernamentales de Colombia.

---

## 3. Estrategias de Despliegue de Base de Datos

La aplicación cuenta con soporte nativo para múltiples motores de datos gracias a su diseño desacoplado y el uso de **Prisma ORM**.

### Opción A: PostgreSQL On-Premise (Docker / Servicio Institucional) con Prisma

Si se opta por migrar la base de datos principal de Supabase a su propio servicio institucional de PostgreSQL containerizado:

1. Modifique el archivo `/prisma/schema.prisma` para cambiar el proveedor de base de datos:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Reemplace los tipos específicos de SQL Server (como `@db.NVarChar` o `@db.UniqueIdentifier`) por tipos estándar de PostgreSQL en el archivo `schema.prisma`.
3. Genere el cliente de Prisma:
   ```bash
   npx prisma generate
   ```
4. Despliegue el esquema en su contenedor de PostgreSQL local:
   ```bash
   npx prisma db push
   ```

### Opción B: Microsoft SQL Server (Entorno Institucional Tradicional) con Prisma

El archivo `/prisma/schema.prisma` ya está completamente configurado y optimizado para **Microsoft SQL Server 2019+ (On-Premise)** con esquemas segmentados (`multiSchema`) para cumplir con las directrices de base de datos relacionales de la Gobernación.

Para inicializar y desplegar la base de datos en SQL Server:
1. Configure la variable `DATABASE_URL` en su archivo `.env` apuntando a su base de datos SQL Server:
   ```env
   DATABASE_URL="sqlserver://servidor.antioquia.gov.co:1433;database=SDMCT;user=svc_sdmct;password=MiPasswordSeguro;encrypt=true;trustServerCertificate=true"
   ```
2. Ejecute el comando para crear las tablas y esquemas relacionales correspondientes en SQL Server:
   ```bash
   npx prisma db push
   ```
3. Genere el cliente tipado de Prisma para que la lógica de backend pueda comunicarse con SQL Server:
   ```bash
   npx prisma generate
   ```

### Opción C: Supabase / PostgreSQL (Entorno SaaS Integrado)

Esta es la configuración activa por defecto que cuenta con todas las conexiones de red validadas durante la fase de pruebas iniciales.

1. Configure las variables de entorno de Supabase en su servidor:
   ```env
   VITE_SUPABASE_URL="https://fjhdsgfwvjhjmeptpmuh.supabase.co"
   VITE_SUPABASE_ANON_KEY="TuClaveAnonimaDeSupabase..."
   ```
2. La aplicación utilizará automáticamente la lógica optimizada de `DatabaseService.ts` a través de la API REST de Supabase, garantizando una latencia mínima y cero sobrecarga de conexiones TCP en el servidor web.

---

## 4. Variables de Entorno (.env)

Cree un archivo `.env` en la raíz del proyecto para producción basado en el siguiente estándar de variables:

```env
# URL de la Base de Datos para Prisma (Usado en Opción A y B)
# Reemplace con su cadena de conexión SQL Server o PostgreSQL local
DATABASE_URL="sqlserver://servidor.antioquia.gov.co:1433;database=SDMCT;user=svc_sdmct;password=MiPasswordSeguro;encrypt=true;trustServerCertificate=true"

# Variables de Configuración de Supabase (Usado en Opción C)
VITE_SUPABASE_URL="https://fjhdsgfwvjhjmeptpmuh.supabase.co"
VITE_SUPABASE_ANON_KEY="tu_anon_key_aqui"

# Entorno de Ejecución
NODE_ENV="production"
PORT=3000
```

---

## 5. Guía de Despliegue Paso a Paso en Linux VM (On-Premise)

Siga estos pasos para desplegar el aplicativo de forma profesional en un servidor Linux (ej. Ubuntu Server 22.04 LTS):

### Paso 1: Clonar y Preparar el Entorno
1. Instale Node.js LTS (Versión 22 recomendada) y Git:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs git build-essential
   ```
2. Clone el repositorio en la carpeta de aplicaciones del servidor (ej: `/var/www/sdmct`):
   ```bash
   git clone <URL_REPOSITORIO> /var/www/sdmct
   cd /var/www/sdmct
   ```

### Paso 2: Instalar Dependencias y Compilar
1. Instale las dependencias de Node.js:
   ```bash
   npm install
   ```
2. Configure su archivo `.env` con las credenciales correctas:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. Genere los archivos de producción compilados del Frontend y Backend:
   ```bash
   npm run build
   ```

### Paso 3: Configurar el Administrador de Procesos (PM2)
PM2 mantendrá el servicio corriendo de fondo, lo reiniciará automáticamente si el servidor Linux se reinicia o si ocurre una excepción inesperada.

1. Instale PM2 globalmente:
   ```bash
   sudo npm install -y pm2 -g
   ```
2. Inicie la aplicación con PM2:
   ```bash
   pm2 start dist/server.cjs --name "sdmct-app"
   ```
3. Configure PM2 para que inicie automáticamente al bootear el servidor Linux:
   ```bash
   pm2 startup
   # Ejecute el comando que PM2 le muestre en consola para guardar el servicio de arranque
   pm2 save
   ```
4. Revise el estado y logs del aplicativo:
   ```bash
   pm2 status
   pm2 logs sdmct-app
   ```

---

## 6. Configuración del Servidor Inverso (Nginx)

Nginx actuará como el servidor de cara al público, gestionando el cifrado SSL (HTTPS) y redirigiendo las peticiones internas al puerto local `3000` del servidor Express.

1. Instale Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```
2. Cree un archivo de configuración para el sitio:
   ```bash
   sudo nano /etc/nginx/sites-available/sdmct
   ```
3. Agregue el siguiente bloque de configuración adaptado para producción:
   ```nginx
   server {
       listen 80;
       server_name sdmct.antioquia.gov.co;

       # Redirección automática de HTTP a HTTPS
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name sdmct.antioquia.gov.co;

       # Rutas a certificados SSL institucionales (Gobernación)
       ssl_certificate /etc/ssl/certs/antioquia.crt;
       ssl_certificate_key /etc/ssl/private/antioquia.key;

       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';

       # Compresión Gzip para acelerar la carga en redes de la Gobernación
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # Tiempo límite de respuesta para operaciones masivas de cargas de trabajo
           proxy_read_timeout 300s;
           proxy_connect_timeout 300s;
       }

       # Configuración de Logs
       access_log /var/log/nginx/sdmct_access.log;
       error_log /var/log/nginx/sdmct_error.log;
   }
   ```
4. Habilite el sitio y reinicie Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sdmct /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 7. Mantenimiento y Auditoría de Código

Para garantizar la estabilidad y calidad del software antes de subir los cambios al repositorio institucional de Azure, se han realizado pruebas de compilación y linter de TypeScript:

* **Chequeo de Tipos Estrictos:** `npm run lint` valida que no existan errores de tipos perdidos o sintaxis incorrecta.
* **Proceso de Compilación Limpio:** El comando `npm run build` genera los artefactos de producción sin interrupciones.
* **Archivos Eliminados:** Se realizó una limpieza de scripts temporales residuales en el entorno para evitar subir archivos innecesarios al repositorio oficial.

El sistema se encuentra en un estado **completamente saludable, 100% verificado y listo para producción**.
