import { Link } from 'react-router-dom';
import Footer from "./footer";
import "../../styles/notFound-style.css";

const NotFound = () => {
    return (
        <>
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>404 - Página No Encontrada</h1>
                <p>Lo sentimos, la página que estás buscando no existe.</p>
                <Link to="/">Volver a la página principal</Link>
            </div>
            <Footer />
        </>
    );
};

export default NotFound;