import "../../styles/modal.css";
import PropTypes from "prop-types";

export default function Modal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="confirm" onClick={onConfirm}>Me doy por informado</button>
          <button className="cancel" onClick={onCancel}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
