# Money app Backend

Money app te ayuda a llevar un registro de tus gastos

## Instalación

### Base de datos

Las instrucciones de configuración de la base de datos están en 
[database/README.md](database/README.md).

### Variables de entorno

Configurar estas variables en el archivo `.env` de la raíz del backend o en el
entorno del proceso. El archivo [`.env.example`](.env.example) sirve de guía.
Reiniciar el backend después de cambiar los valores.

| Variable                     | Descripción                                                                                                                                                   | Valor por defecto                                                |
|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `API_PORT`                   | Puerto en el que escucha el backend.                                                                                                                          | `3000`                                                           |
| `API_ENV`                    | Entorno de ejecución. Acepta cualquier texto.  Cuando tiene el valor `dev` se permiten todos los orígenes CORS. | `dev`                                                            |
| `JWT_SECRET`                 | Secreto para firmar los tokens de autenticación. Obligatorio, con al menos 32 bytes sin contar espacios en los extremos.                                      | Sin valor por defecto; obligatorio.                              |
| `CRYPTO_CACHE_MINUTES`*      | Duración de la caché de precios de criptomonedas, en minutos.                                                                                                 | `5`                                                              |
| `CORS_ORIGIN`                | Orígenes permitidos, separados por comas, cuando `API_ENV` es distinto de `dev`.                                                                              | Cadena vacía (sin orígenes en la lista).                         |
| `TRUST_PROXY`*               | Proxies en los que Express confía para determinar la IP del cliente. Admite `loopback`, IP o CIDR; `1` indica un salto de proxy.                              | Desactivado si se omite o se deja vacío. `1` para Docker Compose |
| `AUTH_WINDOW_SECONDS`*       | Duración de la ventana de los límites de autenticación, en segundos.                                                                                          | `900` (15 minutos)                                               |
| `AUTH_ACCOUNT_MAX_FAILURES`* | Máximo de fallos por cuenta para cada operación de autenticación durante la ventana.                                                                          | `5`                                                              |
| `AUTH_IP_MAX_REQUESTS`*      | Máximo de solicitudes por IP durante la ventana, compartido entre las rutas de `/api/auth`.                                                                   | `100`                                                            |
| `AUTH_MAX_ENTRIES`*          | Máximo de contadores de autenticación almacenados en memoria por proceso.                                                                                     | `10000`                                                          |

* \* Opcionales
* Las variables de conexión a la base de datos `MYSQL_*` están descritas
en [Variables de entorno de la base de datos](database/README.md#variables-de-entorno).

#### Secreto de autenticación `JWT_SECRET`

`JWT_SECRET` es obligatorio en todos los entornos, incluido desarrollo: el
servidor no arranca si falta, está vacío o tiene menos de 32 bytes sin contar
espacios en los extremos. La longitud mínima no garantiza aleatoriedad;
para una mayor seguridad genera el valor con:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado en `JWT_SECRET` y mantenlo privado, fuera de Git. Usa el mismo
valor entre reinicios e instancias del backend. Al cambiarlo, las sesiones
existentes dejan de ser válidas y tendrás que iniciar sesión nuevamente.

#### CORS
El backend utiliza un whitelist de orígenes permitidos para controlar el acceso mediante CORS cuando 
la variable de entorno `API_ENV` tiene un valor distinto a `dev`.

Para configurar la lista se debe modificar la variable de entorno `CORS_ORIGIN` definiendo los orígenes 
permitidos separados por comas.

Ejemplo:

```bash
CORS_ORIGIN=http://localhost:8080,https://miapp.com,https://admin.miapp.com
```

#### Límites de autenticación

Estas variables limitan los intentos de autenticación para reducir ataques de fuerza bruta.
Son opcionales porque en caso de no especificarlas usan sus valores por defecto que funcionan generalmente bien.

Configuración por defecto: `AUTH_WINDOW_SECONDS=900`, `AUTH_ACCOUNT_MAX_FAILURES=5`,
`AUTH_IP_MAX_REQUESTS=100`, `AUTH_MAX_ENTRIES=10000`.

Las respuestas de autenticación con límite excedido usan HTTP 429 y exponen
`Retry-After` (segundos de espera).

Los contadores son locales y se pierden al reiniciar. Las entradas
caducadas se limpian periódicamente. Si se alcanza la capacidad, se rechazan
temporalmente nuevas claves sin borrar bloqueos vigentes.

#### Proxy e IP del cliente `TRUST_PROXY`

Para obtener correctamente la IP del cliente en los límites de autenticación se usa `TRUST_PROXY`.

En ejecución directa (sin un proxy como Nginx), dejar `TRUST_PROXY=`vacío: Express usa la IP
de la conexión e ignora `X-Forwarded-For`.

Para desarrollo con npm y Vue, con `npm run serve` Vue también funciona como proxy.
Si ambos procesos están en el mismo equipo, configura `TRUST_PROXY=loopback`.
El proxy de Vue sobrescribe `X-Forwarded-For` con la IP del dispositivo conectado.
Express solo confía en esa cabecera cuando la conexión proviene de loopback;

Para Docker Compose, los archivos de compose ya configuran `TRUST_PROXY=1` para el único salto Nginx
y no publican el puerto del backend para no tener un acceso directo al backend.

Para otra topología, configura `TRUST_PROXY` con la IP o CIDR del proxy de
confianza. No uses confianza global. Reconstruye también la imagen del frontend
para aplicar el cambio de Nginx.

## Node

Instala las dependencias del proyecto:
```bash
npm install
```

Inicia el servidor:
```bash
npm run start
```

Para desarrollo también lo puedes inicializar con:
```bash
npm run watch
```

## Docker
Editar las variables de entorno en el archivo `.env`.

Ejecuta:

```bash
docker build -t money-app .
docker run -d --publish 3000:3000 --env-file ./.env money-app
```

## Docker compose
El archivo [docker-compose.yml](docker-compose.yml) levanta tanto el frontend como el backend. Requiere las imágenes
`money-app-web:latest` y `money-app:latest` disponibles.

Para desplegar en otro servidor no hace falta copiar el repositorio. Colocar
estos dos archivos en la misma carpeta, ejemplo:

```text
money-app/
├── docker-compose.yml
└── .env
```

El `.env` es obligatorio y contiene las variables **del backend**.

El frontend no necesita un archivo de variables de configuración:
`BACKEND_URL=http://backend:3000` está definida directamente en el Compose.
Docker resuelve `backend` al servicio incluido.
Mantener `API_PORT=3000` en el backend para coincidir con esa URL.

El puerto del frontend por defecto es `8085` puedes cambiarlo en la sección de ports.

Ejecuta desde la carpeta que contiene ambos archivos:

```bash
docker compose up -d
```
Puedes ingresar a la app con:
* Desde tu máquina: http://localhost:8085
* Desde otro dispositivo: http://IP_DEL_SERVIDOR:8085
