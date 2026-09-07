# Money app Backend

Money app te ayuda a llevar un registro de tus gastos

## Instalación

### Node
Editar las variables de entorno en el archivo .env (o crearlo en caso de que no exista). El archivo .env.example sirve de guía.

#### Secreto de autenticación

Antes de iniciar el backend, configura `JWT_SECRET` en `.env` o en las variables
del entorno. Es obligatorio en todos los entornos, incluido desarrollo: el
servidor no arranca si falta, está vacío o tiene menos de 32 bytes sin contar
espacios en los extremos. La longitud mínima no garantiza aleatoriedad; 
para una mayor seguridad genera el valor con:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado en `JWT_SECRET` y mantenlo privado, fuera de Git. Usa el mismo
valor entre reinicios e instancias del backend. Al cambiarlo, las sesiones
existentes dejan de ser válidas y tendrás que iniciar sesión nuevamente.


Para iniciar el servidor ejecutar:

```bash
npm install
npm run start
```

### Docker compose
Editar las variables de entorno en el archivo .env.

Ejecutar:

```bash
docker-compose up
```

### Docker
Editar las variables de entorno en el archivo .env.

Ejecutar:

```bash
docker build -t money-app .
docker run -d --publish 3000:3000 --env-file ./.env money-app
```

## CORS
El backend utiliza un whitelist de orígenes permitidos para controlar el acceso mediante CORS cuando la variable de entorno API_ENV tiene un valor distinto a dev.

Para configurar la lista se debe modificar la variable de entorno CORS_ORIGIN definiendo los orígenes permitidos separados por comas.

Ejemplo:

```bash
CORS_ORIGIN=http://localhost:8080,https://miapp.com,https://admin.miapp.com
```

## Límites de autenticación

Las respuestas de autenticación con límite excedido usan HTTP 429 y exponen
`Retry-After` (segundos de espera).

Configuración opcional: `AUTH_WINDOW_SECONDS=900`, `AUTH_ACCOUNT_MAX_FAILURES=5`,
`AUTH_IP_MAX_REQUESTS=100`, `AUTH_MAX_ENTRIES=10000`.
Los contadores son locales y se pierden al reiniciar. Las entradas
caducadas se limpian periódicamente. Si se alcanza la capacidad, se rechazan
temporalmente nuevas claves sin borrar bloqueos vigentes.

### Proxy e IP del cliente

En ejecución directa sin un proxy (como Nginx), deja `TRUST_PROXY` vacío: Express usa la IP
de la conexión e ignora `X-Forwarded-For`. 
Los archivos Docker Compose ya configuran `TRUST_PROXY=1` para el único salto Nginx 
y no publican el puerto del backend para no tener un acceso directo.
Para otra topología, configura `TRUST_PROXY` con la IP o CIDR del proxy de
confianza. No uses confianza global. Reconstruye también la imagen del frontend
para aplicar el cambio de Nginx.
