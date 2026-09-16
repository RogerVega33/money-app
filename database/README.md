# Base de datos

Esta carpeta contiene el esquema de la base de datos para poder replicarla en otro ambiente e iniciar una base de datos desde cero.

```text
database/
├── schema.sql
├── migrations/
└── README.md
```

## Instalación nueva

### Crear la base de datos y el usuario

Conectarse al servidor de la base de datos con una cuenta administradora:

```bash
mysql -h HOST -P PORT -u USER -p
```
**Cuando es una conexión local `-h HOST` y `-P PORT` se pueden omitir**. 
Si el servidor está en Docker con un puerto publicado diferente, podría ser necesario indicarlos aunque esté en la misma máquina.

`-p` solicita la contraseña
de forma interactiva.

Ejecutar el siguiente SQL, reemplazando `REEMPLAZAR_POR_UNA_CONTRASENA_SEGURA`
por la contraseña elegida:

```sql
CREATE DATABASE moneyApp;
CREATE USER 'money-app'@'%' IDENTIFIED BY 'REEMPLAZAR_POR_UNA_CONTRASENA_SEGURA';
GRANT ALL PRIVILEGES ON moneyApp.* TO 'money-app'@'%';
```

`%` permite que esa cuenta se autentique desde cualquier host que pueda conectarse
al servidor. Los permisos concedidos se limitan a la base `moneyApp`.

Si la base o la cuenta ya existen, omitir su creación. Para
instalar el esquema, utilizar siempre una base vacía.

### Importar el esquema

`schema.sql` representa la estructura base.

Importarlo únicamente en una base vacía: contiene `DROP TABLE` y `DROP VIEW`.
No usarlo para actualizar una base con datos.

Desde la raíz del backend, ejecutar en el terminal:

```bash
mysql -h HOST -P PORT -u money-app -p moneyApp < database/schema.sql
```

Reemplazar `HOST` y `PORT` por los valores
correspondientes. Si se eligió otro usuario, ajustar también `-u`.

El esquema utiliza funciones de ventana (`OVER`) y el juego de caracteres
`utf8mb3`. Utilizar una versión del servidor compatible con ambas características;
MySQL 8.0 o posterior es la referencia para este proyecto.

## Migraciones para bases existentes

Para un cambio futuro:

1. Crear un archivo con nombre ordenable, por ejemplo
   `20260920_001_descripcion_del_cambio.sql`.
2. Incluir únicamente el cambio incremental necesario.
3. Probarlo en una base de prueba con la estructura anterior.
4. Ejecutarlo una sola vez en cada entorno pendiente:

   ```bash
   mysql -h HOST -P PORT -u USUARIO -p moneyApp < database/migrations/20260920_001_descripcion_del_cambio.sql
   ```

5. Registrar fuera del repositorio, por entorno, el archivo aplicado y la fecha,
   después de verificar que terminó correctamente.
6. Actualizar `schema.sql` para que una instalación nueva incluya el cambio y
   anotar aquí qué migraciones incorpora. Conservar las migraciones anteriores
   sin modificarlas.

No repetir sobre una instalación nueva las migraciones ya incluidas en su
`schema.sql`.

## Backup

Para obtener un backup de la base de datos ejecutar:

```bash
mysqldump -h HOST -P PORT -u USUARIO -p moneyApp > /RUTA/BACKUP/backup.sql
```

Reemplazar `HOST`, `PORT`, `USUARIO` y la ruta de salida por los valores
correspondientes. La carpeta de destino debe existir.

### Restaurar un backup

Crear primero una base vacía siguiendo la sección de creación de la base y el
usuario. Luego ejecutar en el terminal:

```bash
mysql -h HOST -P PORT -u USUARIO -p moneyApp < /RUTA/BACKUP/backup.sql
```

Reemplazar los valores de conexión y la ruta por los correspondientes al destino
y al archivo de backup. `-p` solicita la contraseña de forma interactiva.
