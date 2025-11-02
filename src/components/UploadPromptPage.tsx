import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Upload, Check, X, ArrowLeft } from 'lucide-react';

interface UploadPromptPageProps {
  onCancel: () => void;
  onCreated: (prompt: any) => void;
}

const ALLOWED_CATEGORIES = [
  { name: 'Photography', emoji: '📷', color: 'from-blue-500 to-cyan-500' },
  { name: 'Casual', emoji: '😎', color: 'from-orange-500 to-yellow-500' },
  { name: 'Character', emoji: '👤', color: 'from-purple-500 to-pink-500' },
  { name: 'Product Review', emoji: '⭐', color: 'from-yellow-500 to-orange-500' },
  { name: 'Landscape', emoji: '🏔️', color: 'from-green-500 to-teal-500' },
  { name: 'Digital Art', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  { name: 'Abstract', emoji: '🌈', color: 'from-indigo-500 to-purple-500' },
  { name: 'Food', emoji: '🍕', color: 'from-red-500 to-orange-500' },
  { name: 'Fashion', emoji: '👗', color: 'from-fuchsia-500 to-pink-500' },
  { name: 'Architecture', emoji: '🏛️', color: 'from-gray-500 to-slate-500' },
  { name: 'Coding', emoji: '💻', color: 'from-blue-600 to-cyan-600' },
  { name: 'UI/UX', emoji: '🎨', color: 'from-purple-600 to-indigo-600' },
  { name: 'Web Design', emoji: '🌐', color: 'from-teal-500 to-emerald-500' },
  { name: 'Logo Design', emoji: '🎯', color: 'from-red-600 to-pink-600' },
  { name: 'Branding', emoji: '✨', color: 'from-amber-500 to-orange-600' },
  { name: 'Marketing', emoji: '📢', color: 'from-green-600 to-lime-600' },
  { name: 'Social Media', emoji: '📱', color: 'from-sky-500 to-blue-500' },
  { name: 'Video', emoji: '🎬', color: 'from-violet-500 to-purple-600' },
  { name: 'Music', emoji: '🎵', color: 'from-rose-500 to-pink-600' },
  { name: 'Writing', emoji: '✍️', color: 'from-slate-600 to-gray-700' },
  { name: 'General', emoji: '📋', color: 'from-blue-500 to-indigo-500' }
];

const UploadPromptPage: React.FC<UploadPromptPageProps> = ({ onCancel, onCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !content.trim()) {
      setError('Please fill title and content');
      return;
    }
    if (!file) {
      setError('Please select an image');
      return;
    }
    if (!agree) {
      setError('You must agree to the disclaimer before uploading');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in');
      const form = new FormData();
      form.append('title', title);
      form.append('content', content);
      form.append('category', category);
      form.append('image', file);
      const baseUrl = 'http://localhost:4000';
      const res = await fetch(`${baseUrl}/api/prompts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.message || 'Failed to create prompt');
      }
      const data = await res.json();
      
      // Show success message before closing
      setSuccess(true);
      setLoading(false);
      setError(null);
      
      // Wait a moment to show success before redirecting
      setTimeout(() => {
        onCreated(data);
      }, 1500);
      
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-gray-50 to-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6 animate-fade-in-up">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white rounded-full transition-all duration-300 hover:scale-110 mr-4"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <span>Create New Prompt</span>
            </h1>
            <p className="text-gray-600 mt-1">Share your creative AI prompts with the community</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Title */}
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Prompt Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-gray-300"
                placeholder="Enter a catchy title..."
              />
            </div>

            {/* Category Bubbles */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Category</label>
              <div className="flex flex-wrap gap-3">
                {ALLOWED_CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`group relative px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-110 hover:shadow-lg ${
                      category === cat.name
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-xl scale-105`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-sm">{cat.name}</span>
                    </span>
                    {category === cat.name && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Content */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prompt Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={10}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-gray-300 resize-none"
                placeholder="Write your detailed prompt here... Be creative and specific!"
              />
              <p className="text-xs text-gray-500 mt-2">{content.length} characters</p>
            </div>

            {/* Image Upload Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-dashed border-purple-200">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <span>Sample Image</span>
              </label>
              
              {!preview ? (
                <label className="flex flex-col items-center justify-center w-full h-64 cursor-pointer hover:bg-purple-100/50 transition-all duration-300 rounded-xl group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <p className="mb-2 text-sm text-gray-600">
                      <span className="font-semibold text-purple-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      setPreview(f ? URL.createObjectURL(f) : null);
                    }}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative group">
                  <img 
                    src={preview} 
                    alt="preview" 
                    className="w-full h-96 object-cover rounded-xl border-4 border-white shadow-lg" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Image uploaded</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <input
                  id="agree"
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-semibold text-gray-900">I confirm that:</span> I have the proper consent to upload this content, and it does not contain any illegal, harmful, or inappropriate material. I agree to follow community guidelines and understand uploads may be moderated.
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-shake">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 animate-fade-in-up">
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm text-green-800 font-semibold">Prompt Published Successfully! 🎉</p>
                    <p className="text-xs text-green-600 mt-1">Redirecting to home page...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button 
                type="button" 
                onClick={onCancel} 
                className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || !agree} 
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Publish Prompt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadPromptPage;
