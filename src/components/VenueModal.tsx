import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: {
    id?: string;
    name: string;
    location: string;
    capacity: number;
  };
  onSave: (values: { id?: string; name: string; location: string; capacity: number }) => void;
}

export const VenueModal: React.FC<VenueModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 0
  });

  // Reset form when modal opens/closes or initialValues change
  useEffect(() => {
    if (isOpen && initialValues) {
      setFormData({
        name: initialValues.name,
        location: initialValues.location || '',
        capacity: initialValues.capacity || 0
      });
    } else {
      setFormData({
        name: '',
        location: '',
        capacity: 0
      });
    }
  }, [isOpen, initialValues]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate capacity is a positive number
    const capacity = parseInt(formData.capacity.toString());
    if (isNaN(capacity) || capacity < 0) {
      alert('Capacity must be a positive number');
      return;
    }

    onSave({
      id: initialValues?.id,
      name: formData.name,
      location: formData.location,
      capacity
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialValues?.id ? 'Edit Venue' : 'Add Venue'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter venue name"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter venue location"
              />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter venue capacity"
                min="0"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
            >
              {initialValues?.id ? 'Save Changes' : 'Add Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};