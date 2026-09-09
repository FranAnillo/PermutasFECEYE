import Footer from "./footer";
import { Link } from "react-router-dom";
import "../../styles/policy-common-style.css";

export default function CookiesPolicy() {
  return (
    <>
      <div className="policy-container">
        <div className="back-link-container">
          <Link to="/" className="back-link">Volver a la página principal</Link>
        </div>

        <div className="policy-header">
          <h1>Política de Cookies</h1>
          <p>Última actualización: Abril 2025</p>
        </div>

        <section className="policy-section">
          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu
            dispositivo cuando visitas un sitio web. Estas permiten que el sitio
            web recuerde tus acciones y preferencias (como inicio de sesión,
            idioma, tamaño de fuente y otras configuraciones) durante un período
            de tiempo.
          </p>
        </section>

        <section className="policy-section">
          <h2>2. ¿Qué tipos de cookies utilizamos?</h2>
          <p>
            En nuestra aplicación utilizamos los siguientes tipos de cookies:
          </p>
          <ul>
            <li>
              <strong>Cookies esenciales:</strong> Son necesarias para el
              funcionamiento básico de la aplicación y no pueden ser
              desactivadas.
            </li>
            <li>
              <strong>Cookies de funcionalidad:</strong> Permiten recordar tus
              preferencias y mejorar tu experiencia de usuario.
            </li>
            <li>
              <strong>Cookies analíticas:</strong> Nos ayudan a entender cómo
              los usuarios interactúan con nuestra aplicación, recopilando
              información de manera anónima.
            </li>
          </ul>
        </section>
        <section className="policy-section">
          <h2>3. ¿Cómo puedes gestionar las cookies?</h2>
          <p>
            Puedes gestionar o desactivar las cookies a través de la
            configuración de tu navegador. Ten en cuenta que desactivar ciertas
            cookies puede afectar la funcionalidad de la aplicación.
          </p>
          <p>
            A continuación, te proporcionamos enlaces a las instrucciones para
            gestionar cookies en los navegadores más populares:
          </p>
          <ul>
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
              >
                Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/es-es/windows/administrar-cookies-en-microsoft-edge-ver-permitir-bloquear-eliminar-y-usar-168dab11-0753-043d-7c16-ede5947fc64d"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>4. Cambios a esta política</h2>
          <p>
            Podemos actualizar nuestra Política de Cookies de vez en cuando. Te
            notificaremos sobre cambios importantes publicando una nueva versión
            en esta página.
          </p>
        </section>

        <section className="policy-section">
          <h2>5. Contacto</h2>
          <p>
            Si tienes alguna pregunta o inquietud sobre nuestra Política de
            Cookies, consulta los canales institucionales de FECEYE:
          </p>
          <ul>
            <li>Facultad de Ciencias Económicas y Empresariales, Universidad de Sevilla.</li>
          </ul>
        </section>
      </div>
      <div style={{ height: '80px' }} />
      <Footer />
    </>
  );
}
