import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getSystemPrompts, saveSystemPrompt, deleteSystemPrompt } from '../../lib/storage/localStorage';
import type { SystemPrompt } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SystemPromptModal from './SystemPromptModal';

export default function SystemPromptsScreen() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>(getSystemPrompts());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPrompts = prompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    const now = new Date().toISOString();
    const newPrompt: SystemPrompt = {
      id: uuidv4(),
      name: '',
      content: '',
      description: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isDefault: false,
    };
    setEditingPrompt(newPrompt);
    setIsModalOpen(true);
  };

  const handleEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleSave = (prompt: SystemPrompt) => {
    saveSystemPrompt({
      ...prompt,
      updatedAt: new Date().toISOString(),
    });
    setPrompts(getSystemPrompts());
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this system prompt?')) {
      deleteSystemPrompt(id);
      setPrompts(getSystemPrompts());
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to Chat"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">System Prompts</h1>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompts..."
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Prompts list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No prompts found matching your search.' : 'No system prompts yet. Create one to get started!'}
            </p>
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {prompt.name || 'Untitled'}
                    {prompt.isDefault && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        Default
                      </span>
                    )}
                  </h3>
                  {prompt.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{prompt.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(prompt)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    disabled={prompt.isDefault}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={prompt.isDefault ? 'Cannot delete default prompt' : 'Delete'}
                  >
                    <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                {prompt.content || <span className="italic text-gray-500">No content</span>}
              </p>

              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {prompt.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Used {prompt.usageCount} times • Updated {new Date(prompt.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && editingPrompt && (
        <SystemPromptModal
          prompt={editingPrompt}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
