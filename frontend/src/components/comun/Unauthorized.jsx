import { Link } from 'react-router-dom';
import Footer from "./footer";
import "../../styles/unauthorized-style.css";

export default function Unauthorized() {
    return (
        <>
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>401 - Acceso denegado</h1>
                <p> No tienes permisos para ver esta página.</p>
                <Link to="/">Volver a la página principal</Link>
            </div>
            <Footer />
        </>
    );
};