import Footer from "./footer";
import "../../styles/policy-common-style.css";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <>
      <div className="policy-container">
        <div className="back-link-container">
          <Link to="/" className="back-link">Volver a la página principal</Link>
        </div>
        
        <div className="policy-header">
          <h1>Política de Privacidad</h1>
          <p>Última actualización: Marzo 2025</p>
        </div>

        <section className="policy-section">
          <h2>1. Información que recopilamos</h2>
          <p>
            Recopilamos la siguiente información para brindarte una mejor
            experiencia:
          </p>
          <ul>
            <li>
              <strong>Información personal:</strong> Nombre, correo electrónico,
              y otra información relevante que nos proporcionas al registrarte.
            </li>
            <li>
              <strong>Información de uso:</strong> Datos sobre cómo utilizas la
              aplicación, como las permutas realizadas y las preferencias de
              búsqueda.
            </li>
            <li>
              <strong>Información técnica:</strong> Dirección IP, tipo de
              dispositivo, sistema operativo y datos de navegación.
            </li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>2. Cómo utilizamos tu información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul>
            <li>Mejorar la funcionalidad de la aplicación.</li>
            <li>Personalizar la experiencia de usuario.</li>
            <li>
              Enviarte actualizaciones y notificaciones relevantes sobre tu
              cuenta o la aplicación.
            </li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>3. Compartir tu información</h2>
          <p>
            Tu información personal no será compartida con terceros sin tu
            consentimiento, excepto en los siguientes casos:
          </p>
        </section>

        <section className="policy-section">
          <h2>4. Seguridad de la información</h2>
          <p>
            Nos comprometemos a proteger tu información personal. Implementamos
            medidas de seguridad razonables para evitar el acceso no autorizado,
            la alteración o la divulgación de tu información.
          </p>
        </section>

        <section className="policy-section">
          <h2>5. Tus derechos</h2>
          <p>
            Dependiendo de tu jurisdicción, puedes tener derecho a acceder,
            corregir o eliminar tus datos personales. Si deseas ejercer estos
            derechos, puedes contactarnos a través de los medios proporcionados
            al final de esta política.
          </p>
        </section>

        <section className="policy-section">
          <h2>6. Cambios a esta política</h2>
          <p>
            Podemos actualizar nuestra Política de Privacidad de vez en cuando.
            Te notificaremos sobre cambios importantes publicando una nueva
            versión en esta página.
          </p>
        </section>

        <section className="policy-section">
          <h2>7. Contacto</h2>
          <p>
            Si tienes alguna pregunta o inquietud sobre nuestra Política de
            Privacidad, consulta los canales institucionales de FCEYE:
          </p>
          <ul>
            <li>Facultad de Ciencias Económicas y Empresariales, Universidad de Sevilla.</li>
          </ul>
        </section>
      </div>
      <Footer />
    </>
  );
}
