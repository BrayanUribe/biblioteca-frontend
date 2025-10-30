# 📚 Biblioteca Frontend

Este es el **frontend del sistema de gestión de biblioteca**, desarrollado con **Angular** y **TypeScript**.  
Forma parte de una aplicación completa para la administración de **usuarios, libros, autores y préstamos**, con autenticación y control de acceso por rutas protegidas.

---

## 🚀 Descripción general

La aplicación permite gestionar todos los procesos de una biblioteca de manera digital:

- 👤 **Gestión de usuarios:** creación, edición, activación/desactivación y eliminación.  
- 📚 **Gestión de libros:** CRUD completo con imágenes, sinopsis y disponibilidad.  
- ✍️ **Gestión de autores:** listado, creación y visualización de los libros de cada autor.  
- 📖 **Gestión de préstamos:** solicitud, seguimiento y registro de préstamos activos.  
- 🔒 **Autenticación:** login con JWT y protección de rutas según el estado del usuario.  
- 🌗 **Modo claro/oscuro:** interfaz moderna, limpia y adaptable.

---

## 🧰 Tecnologías utilizadas

- **Angular CLI**  
- **TypeScript**  
- **HTML5 + SCSS / TailwindCSS**  
- **RxJS**  
- **JWT (para autenticación)**  
- **Git / GitHub**

---

## ⚙️ Instalación y ejecución

1. Clona este repositorio:

   ```bash
   git clone https://github.com/BrayanUribe/biblioteca-frontend.git
   cd biblioteca-frontend
Instala las dependencias:

bash
Copiar código
npm install
Inicia el servidor local:

bash
Copiar código
ng serve
Abre el navegador y entra a 👉 http://localhost:4200

🧩 Estructura general del proyecto
bash
Copiar código
src/
 ├── app/
 │   ├── components/     # Componentes principales del sistema
 │   ├── pages/          # Vistas del sistema (Usuarios, Libros, Autores, etc.)
 │   ├── services/       # Servicios para consumir la API REST
 │   ├── guards/         # Protección de rutas
 │   └── models/         # Interfaces y tipos de datos
 ├── assets/             # Imágenes y recursos estáticos
 ├── environments/       # Configuraciones de entorno
 └── index.html          # Punto de entrada principal
🔐 Autenticación y protección de rutas

El sistema utiliza JWT (JSON Web Tokens) para autenticar a los usuarios.
Solo los usuarios con sesión activa pueden acceder a las rutas protegidas, y el frontend valida los permisos antes de renderizar componentes sensibles.

🧑‍💻 Autor
Brayan Uribe
💼 Desarrollador Full Stack
🌐 GitHub

📝 Licencia
Este proyecto fue desarrollado con fines académicos y puede ser utilizado o adaptado libremente con fines educativos o de práctica profesional.






