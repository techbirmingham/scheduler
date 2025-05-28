import React, { useState } from 'react';
import { Cog, Plus, Edit, Trash, X } from 'lucide-react';
import { useStore } from '../store';

type SettingsCategory = 
  | 'sessionTypes'
  | 'tracks'
  | 'organizations'
  | 'programs'
  | 'experiences'
  | 'accessLevels';

interface CategoryItemProps {
  id: string;
  name: string;
  onEdit: (id: string, newName: string, color?: string) => void;
  onDelete: (id: string) => void;
  color?: string;
  canEditColor?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ 
  id, name, onEdit, onDelete, color, canEditColor = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editColor, setEditColor] = useState(color || '#3B82F6');
  
  const handleSave = () => {
    if (editName.trim()) {
      if (canEditColor && color) {
        onEdit(id, editName, editColor);
      } else {
        onEdit(id, editName);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(name);
      setEditColor(color || '#3B82F6');
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
      {isEditing ? (
        <div className="flex items-center flex-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-1 border border-gray-300 rounded mr-2"
            autoFocus
          />
          {canEditColor && (
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-8 h-8 border-0 p-0 bg-transparent"
            />
          )}
          <button
            onClick={handleSave}
            className="ml-2 text-green-600 hover:text-green-800"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditName(name);
              setEditColor(color || '#3B82F6');
            }}
            className="ml-2 text-gray-600 hover:text-gray-800"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center">
            {color && (
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: color }}
              />
            )}
            <span>{name}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-indigo-600"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="text-gray-500 hover:text-red-600"
            >
              <Trash size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface CategorySectionProps {
  title: string;
  items: { id: string; name: string; color?: string }[];
  onAdd: (name: string, color?: string) => void;
  onEdit: (id: string, name: string, color?: string) => void;
  onDelete: (id: string) => void;
  canEditColor?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  canEditColor = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState('#3B82F6');
  
  const handleAdd = () => {
    if (newItemName.trim()) {
      if (canEditColor) {
        onAdd(newItemName, newItemColor);
      } else {
        onAdd(newItemName);
      }
      setNewItemName('');
      setNewItemColor('#3B82F6');
      setShowAddForm(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setShowAddForm(false);
      setNewItemName('');
      setNewItemColor('#3B82F6');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h2 className="text-lg font-medium text-gray-800">{title}</h2>
      </div>
      
      <div className="p-6">
        <div className="space-y-2 mb-4">
          {items.map(item => (
            <CategoryItem
              key={item.id}
              id={item.id}
              name={item.name}
              color={item.color}
              onEdit={onEdit}
              onDelete={onDelete}
              canEditColor={canEditColor}
            />
          ))}
        </div>
        
        {showAddForm ? (
          <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex items-center">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`New ${title.toLowerCase().slice(0, -1)} name`}
                className="flex-1 p-2 border border-gray-300 rounded"
                autoFocus
              />
              
              {canEditColor && (
                <input
                  type="color"
                  value={newItemColor}
                  onChange={(e) => setNewItemColor(e.target.value)}
                  className="ml-2 w-8 h-8 border-0 p-0 bg-transparent"
                />
              )}
              
              <button
                onClick={handleAdd}
                className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewItemName('');
                  setNewItemColor('#3B82F6');
                }}
                className="ml-2 text-gray-600 hover:text-gray-800"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <Plus size={16} className="mr-1" />
            Add {title.slice(0, -1)}
          </button>
        )}
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { 
    sessionTypes, tracks, organizations, 
    programs, experiences, accessLevels,
    addSessionType, updateSessionType, deleteSessionType,
    addTrack, updateTrack, deleteTrack,
    addOrganization, updateOrganization, deleteOrganization,
    addProgram, updateProgram, deleteProgram,
    addExperience, updateExperience, deleteExperience,
    addAccessLevel, updateAccessLevel, deleteAccessLevel
  } = useStore();
  
  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center mb-6">
        <Cog className="text-indigo-600 mr-2" size={24} />
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategorySection
          title="Session Types"
          items={sessionTypes}
          onAdd={(name, color) => addSessionType({ name, color })}
          onEdit={(id, name, color) => updateSessionType(id, { name, color })}
          onDelete={deleteSessionType}
          canEditColor={true}
        />
        
        <CategorySection
          title="Tracks"
          items={tracks}
          onAdd={(name, color) => addTrack({ name, color })}
          onEdit={(id, name, color) => updateTrack(id, { name, color })}
          onDelete={deleteTrack}
          canEditColor={true}
        />
        
        <CategorySection
          title="Partner Organizations"
          items={organizations}
          onAdd={(name) => addOrganization({ name })}
          onEdit={(id, name) => updateOrganization(id, { name })}
          onDelete={deleteOrganization}
        />
        
        <CategorySection
          title="Programs"
          items={programs}
          onAdd={(name) => addProgram({ name })}
          onEdit={(id, name) => updateProgram(id, { name })}
          onDelete={deleteProgram}
        />
        
        <CategorySection
          title="Experiences"
          items={experiences}
          onAdd={(name) => addExperience({ name })}
          onEdit={(id, name) => updateExperience(id, { name })}
          onDelete={deleteExperience}
        />
        
        <CategorySection
          title="Access Levels"
          items={accessLevels}
          onAdd={(name) => addAccessLevel({ name })}
          onEdit={(id, name) => updateAccessLevel(id, { name })}
          onDelete={deleteAccessLevel}
        />
      </div>
    </div>
  );
};