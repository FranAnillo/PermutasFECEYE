import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from './themeContextBase.js';

export const ThemeProvider = ({ children }) => {
    // Inicializar tema desde localStorage o preferencia del sistema
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        // Aplicar clase al body
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        // Guardar preferencia
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
