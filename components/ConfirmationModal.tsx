// components/ConfirmationModal.tsx
import React from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  // Get the element to portal into
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; // Should not happen if modal-root is in index.html

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="bg-tech-panel-dark p-6 rounded-lg shadow-lg max-w-sm mx-auto border border-tech-accent-blue text-white">
        <h3 className="text-xl font-bold mb-4 text-tech-light-blue">{title}</h3>
        <p className="mb-6 text-tech-text-gray">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-tech-light-blue rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-tech-accent-blue focus:ring-opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    modalRoot // Render into the modal-root element
  );
};

export default ConfirmationModal;
