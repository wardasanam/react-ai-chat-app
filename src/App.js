import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
// Removed all 'react-syntax-highlighter' imports to fix build errors.

/**
 * A utility function to make fetch requests with exponential backoff.
 */
async function fetchWithBackoff(url, options, signal, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, { ...options, signal });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted');
      throw error;
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, signal, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
}

// --- UPDATED: Default chat structure ---
const createNewChat = () => ({
  id: crypto.randomUUID(),
  name: 'New Chat', // Will be updated automatically
  systemPrompt: 'You are a helpful AI assistant.',
  messages: [
    {
      id: crypto.randomUUID(),
      role: 'model',
      text: 'Hello! I am a helpful AI assistant. How can I help you today?',
    },
  ],
  isPinned: false, // --- NEW: Pinned status ---
  createdAt: Date.now(), // --- NEW: Timestamp for sorting ---
});

// Utility function to check message role
const isUser = (msg) => msg.role === 'user';


// --- ALL HELPER COMPONENTS MOVED HERE ---
// This fixes the "ReferenceError: ... is not defined" errors.

// --- Icon Components --- (Includes NEW Icons: Pin, Share, Trash, Edit)
const ModelIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0 bg-gray-700 text-white p-1 rounded-full"> <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l2.846.813a4.5 4.5 0 013.09 3.09L24.75 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L18.25 12zM12 1.25l.813 2.846a4.5 4.5 0 013.09 3.09L18.75 9.75l-2.846.813a4.5 4.5 0 01-3.09 3.09L12 16.5l-.813-2.846a4.5 4.5 0 01-3.09-3.09L5.25 9.75l2.846-.813a4.5 4.5 0 013.09-3.09L12 1.25z" /> </svg> );
const UserIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0 bg-gray-200 dark:bg-gray-600 p-1 rounded-full"> <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /> </svg> );
const SunIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-300"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12H.75m.386-6.364l1.591 1.591" /> </svg> );
const MoonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-300"> <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 008.25-4.498z" /> </svg> );
const LoadingIndicator = () => ( <div className="flex justify-start items-center space-x-3 p-1"> <div className="flex-shrink-0"><ModelIcon /></div> <div className="flex items-center space-x-1 p-3 px-4 rounded-xl bg-white dark:bg-gray-700 shadow-md"> <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div> <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div> <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div> </div> </div> );
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.875L5.999 12zm0 0h7.5" /> </svg> );
const StopIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /> </svg> );
const NewChatIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> </svg> );
const CopyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876V5.25a.375.375 0 00-.375-.375H5.625a.375.375 0 00-.375.375v3.375c0 .621.504 1.125 1.125 1.125h9.75A1.125 1.125 0 0115.75 17.25z" /> </svg> );
const CheckIcon = ({ size = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${size} ${size === 'w-4 h-4' ? 'text-green-400' : ''}`}> <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> </svg> );
const RegenerateIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg> );
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /> </svg> );
const ClearSearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> );
const MenuIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /> </svg> );
const SettingsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.002 1.132-1.223l.423-.081c.218-.041.442.02.61.166l.423.364c.264.228.6.35.944.35h.423c.344 0 .68-.122.944-.35l.423-.364c.168-.146.392-.207.61-.166l.423.081c.572.221 1.042.68 1.132 1.223l.09.546c.033.199.13.38.29.52l.423.365c.263.227.422.56.422.92v.423c0 .36-.159.693-.422.92l-.423.365c-.16.14-.257.321-.29.52l-.09.546c-.09.542-.56 1.002-1.132 1.223l-.423.081c-.218.041-.442-.02-.61-.166l-.423-.364c-.264-.228-.6-.35-.944-.35h-.423c-.344 0-.68.122-.944.35l-.423.364c-.168-.146-.392.207-.61-.166l-.423.081c-.572.221-1.042.68-1.132 1.223l-.09.546c-.033.199-.13.38-.29.52l-.423.365c-.263.227-.422.56-.422.92v.423c0 .36.159.693.422.92l.423.365c.16.14.257.321.29.52l.09.546c.09.542.56 1.002 1.132 1.223l.423.081c.218.041.442-.02.61-.166l.423-.364c.264-.228.6-.35.944.35h.423c.344 0 .68-.122.944.35l.423.364c.168-.146.392.207.61-.166l.423.081c.572.221 1.042.68 1.132 1.223l.09.546c.033.199.13.38.29.52l.423.365c.263.227.422.56.422.92v.423c0 .36-.159.693-.422.92l-.423.365c-.16.14-.257.321-.29.52l-.09.546c-.09.542-.56 1.002-1.132 1.223l-.423.081c-.218.041-.442-.02-.61-.166l-.423-.364c-.264-.228-.6-.35-.944-.35h-.423c-.344 0-.68.122-.944.35l-.423.364c-.168-.146-.392.207-.61-.166l-.423.081c-.572-.221-1.042-.68-1.132-1.223l-.09-.546c-.033-.199-.13-.38-.29-.52l-.423-.365c-.263-.227-.422-.56-.422-.92v-.423c0-.36.159-.693.422-.92l.423-.365c.16-.14.257-.321.29-.52l.09-.546c.09-.542.56-1.002 1.132-1.223l.423-.081c.218-.041.442.02.61.166l.423.364c.264.228.6.35.944.35h.423c.344 0 .68-.122.944.35l.423.364c.168-.146.392.207.61-.166l.423.081c.572-.221 1.042-.68 1.132-1.223l.09-.546c.033-.199-.13-.38-.29-.52l.423-.365c-.263-.227-.422-.56-.422-.92v-.423c0-.36-.159-.693-.422-.92l-.423-.365c-.16-.14-.257-.321-.29-.52l-.09-.546z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg> );
const EditIcon = ({ size = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={size}> <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /> </svg> );
const PinIcon = ({ filled = false, size = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={size}> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" /> </svg> );
const ShareIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"> <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /> </svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"> <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /> </svg> );


/**
 * --- UPDATED: Sidebar Component with Actions ---
 */
const Sidebar = ({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  isOpen,
  onClose,
  onDeleteChat,
  onTogglePinChat,
  onRenameChat,
  onShareChat,
}) => {
  const [hoveredChatId, setHoveredChatId] = useState(null);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 sm:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>
      <div
        className={`fixed sm:static flex flex-col z-40 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-72 flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Conversations</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 sm:hidden"
            title="Close Menu"
          >
            <ClearSearchIcon />
          </button>
        </div>
        <button
          onClick={onNewChat}
          className="m-4 p-3 rounded-lg flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          <NewChatIcon />
          New Chat
        </button>
        <nav className="flex-grow overflow-y-auto space-y-1 p-2">
          {chats.map(chat => (
            <div
              key={chat.id}
              onMouseEnter={() => setHoveredChatId(chat.id)}
              onMouseLeave={() => setHoveredChatId(null)}
              className={`relative group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                chat.id === currentChatId
                  ? 'bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {/* Pin Icon */}
              {chat.isPinned && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 text-yellow-500">
                    <PinIcon size="w-3 h-3"/>
                </div>
              )}
              {/* Chat Name */}
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`flex-grow text-left truncate text-sm pl-${chat.isPinned ? 4 : 0}`} // Indent if pinned
              >
                {chat.name}
              </button>
              {/* Action Buttons (Show on hover or if it's the current chat) */}
              {(hoveredChatId === chat.id || chat.id === currentChatId) && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1 bg-inherit pl-2">
                   <button
                    onClick={(e) => { e.stopPropagation(); onRenameChat(chat.id); }}
                    className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Rename"
                  >
                    <EditIcon size="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onTogglePinChat(chat.id); }}
                    className={`p-1 rounded ${chat.isPinned ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'} hover:bg-gray-200 dark:hover:bg-gray-700`}
                    title={chat.isPinned ? "Unpin" : "Pin"}
                  >
                    <PinIcon filled={chat.isPinned} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onShareChat(chat.id); }}
                    className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Share (Copy JSON)"
                  >
                    <ShareIcon />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};


/**
 * --- NEW: Settings Modal Component ---
 */
const SettingsModal = ({ isOpen, onClose, chat, onSave }) => {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (chat) {
      setName(chat.name);
      setSystemPrompt(chat.systemPrompt);
    }
  }, [chat, isOpen]); // Rerun when isOpen changes to reset correctly

  const handleSave = (e) => {
    e.preventDefault(); // Prevent form submission
    onSave(name, systemPrompt);
  };

  if (!isOpen || !chat) return null; // Ensure chat exists

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose} // Close on overlay click
        aria-hidden="true"
      ></div>
      <div
         className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg p-6"
         role="dialog"
         aria-modal="true"
         aria-labelledby="settings-modal-title"
      >
        <h2 id="settings-modal-title" className="text-2xl font-bold mb-4 dark:text-white">Chat Settings</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="chat-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chat Name
            </label>
            <input
              id="chat-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="system-prompt-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System Prompt (AI Persona)
            </label>
            <textarea
              id="system-prompt-input"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={5}
              placeholder="e.g., You are a pirate captain."
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This sets the behavior and personality of the AI for this chat.</p>
          </div>


          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button" // Important: Prevents implicit form submission
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit" // Allows submitting by pressing Enter in inputs
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
};


// --- Custom Code Block Component with Copy Button ---
const CodeBlock = ({ className, children }) => {
  const [isCopied, setIsCopied] = useState(false);
  const textToCopy = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'none';

  const handleCopy = () => {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed'; // Use fixed to avoid scrolling issues
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="code-block-wrapper my-2">
       <div className="flex justify-between items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-t-md">
         <span className="text-xs text-gray-600 dark:text-gray-400 select-none font-medium">{lang}</span>
         <button
           onClick={handleCopy}
           className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
           title="Copy code"
         >
           {isCopied ? <CheckIcon size="w-4 h-4" /> : <CopyIcon />}
         </button>
       </div>
      <pre
        className={`code-block bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-3 pt-3 rounded-b-md overflow-x-auto font-mono text-sm ${className || ''}`}
      >
        <code className={`language-${lang}`}>{textToCopy}</code>
      </pre>
    </div>
  );
};


// --- Component to render Markdown and (uncolored) code blocks ---
const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          return !inline ? (
            <CodeBlock className={className} {...props}>
              {children}
            </CodeBlock>
          ) : (
            <code className="bg-gray-200 dark:bg-gray-600 rounded-md px-1.5 py-0.5 font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },
        ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2 pl-4 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2 pl-4 space-y-1" {...props} />,
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
        em: ({node, ...props}) => <em className="italic" {...props} />,
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-3 border-b pb-1 dark:border-gray-600" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-2 border-b pb-1 dark:border-gray-600" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-medium my-2" {...props} />,
        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic my-2 text-gray-600 dark:text-gray-400" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};


/**
 * Component for rendering a single chat message
 */
const ChatMessage = ({ msg, showRegenerate, onRegenerate, onEdit, isEditing, isLoading }) => {
  return (
    <div className={`flex items-start space-x-3 ${isUser(msg) ? 'justify-end' : 'justify-start'}`}>
      {!isUser(msg) && (
        <div className="flex-shrink-0 pt-1">
          <ModelIcon />
        </div>
      )}

      <div className={`flex flex-col items-start ${isUser(msg) ? 'items-end' : 'items-start'}`}>
        <div
          className={`max-w-lg lg:max-w-2xl p-3 px-4 shadow-md transition-all ${
            isEditing ? 'ring-2 ring-blue-500' : ''
          } ${
            isUser(msg)
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-t-2xl rounded-bl-2xl'
              : 'bg-white text-gray-800 dark:bg-gray-700 dark:text-white rounded-t-2xl rounded-br-2xl'
          }`}
        >
          <MarkdownRenderer content={msg.text} />
        </div>

        <div className="flex items-center space-x-2">
          {showRegenerate && (
            <button
              onClick={onRegenerate}
              className="mt-2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Regenerate response"
            >
              <RegenerateIcon />
            </button>
          )}
          {isUser(msg) && !isEditing && !isLoading && ( // Don't show edit while loading
            <button
              onClick={() => onEdit(msg)}
              className="mt-2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Edit message"
            >
              <EditIcon />
            </button>
          )}
        </div>
      </div>

      {isUser(msg) && (
        <div className="flex-shrink-0 pt-1">
          <UserIcon />
        </div>
      )}
    </div>
  );
};


/**
 * Main Chat Component
 */
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : true;
  });

  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      // --- Migration & Defaults ---
      return parsedChats.map(chat => ({
        id: chat.id || crypto.randomUUID(),
        name: chat.name || 'Chat',
        systemPrompt: chat.systemPrompt || 'You are a helpful AI assistant.',
        messages: (chat.messages || []).map(msg => ({
          ...msg,
          id: msg.id || crypto.randomUUID(),
        })),
        isPinned: chat.isPinned || false, // Add default pinned status
        createdAt: chat.createdAt || Date.now(), // Add default timestamp
      }));
    }
    return [createNewChat()];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    const savedId = localStorage.getItem('currentChatId');
    // Ensure the saved ID is valid, otherwise default to the first chat
    const firstChatId = chats.length > 0 ? chats.sort((a,b) => b.createdAt - a.createdAt)[0].id : null; // Sort by creation to get the actual first one
    return savedId && chats.some(c => c.id === savedId) ? savedId : firstChatId;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(''); // For copy feedback

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // --- Find current chat, handle case where it might not exist ---
  const currentChat = chats.find(chat => chat.id === currentChatId);
  // If currentChatId is invalid (e.g., after deletion), select the first chat
  useEffect(() => {
      if (!currentChat && chats.length > 0) {
          // Sort chats: pinned first, then by creation date descending
          const sortedChats = [...chats].sort((a, b) => {
             if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
             return b.createdAt - a.createdAt; // Most recent first
          });
          setCurrentChatId(sortedChats[0].id);
      } else if (!currentChat && chats.length === 0) {
          // If no chats exist, create one
          handleNewChat();
      }
  }, [currentChat, chats, currentChatId]);


  const messages = currentChat ? currentChat.messages : []; // Use empty array if no chat found yet

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    // Only save if currentChatId is valid
    if (currentChatId && chats.some(c => c.id === currentChatId)) {
        localStorage.setItem('currentChatId', currentChatId);
    }
    setError(null);
    setSearchTerm('');
    setEditingMessageId(null);
    setInput('');
    abortControllerRef.current?.abort();
  }, [currentChatId]);

  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    const newChat = createNewChat();
    setChats(prevChats => [newChat, ...prevChats]); // Add to the start (becomes most recent)
    setCurrentChatId(newChat.id);
    setIsSidebarOpen(false);
    setEditingMessageId(null);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const updateCurrentChat = (updateFn) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === currentChatId ? updateFn(chat) : chat
      )
    );
  };

  /**
   * Handles form submission (new message OR edit)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentChat) return; // Don't submit if no chat is selected

    const userInput = input.trim();
    if (!userInput) return;

    abortControllerRef.current = new AbortController();
    let historyToSubmit;
    let isFirstUserMessage = false;

    if (editingMessageId) {
      // --- EDIT ---
      const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex === -1) return;

      const editedHistory = messages.slice(0, messageIndex + 1).map(msg =>
        msg.id === editingMessageId ? { ...msg, text: userInput } : msg
      );

      updateCurrentChat(chat => ({ ...chat, messages: editedHistory }));
      historyToSubmit = editedHistory;
      setEditingMessageId(null);

    } else {
      // --- NEW MESSAGE ---
      const newUserMessage = { id: crypto.randomUUID(), role: 'user', text: userInput };
      const newMessages = [...messages, newUserMessage];
      
      // --- Auto-naming: Check if this is the first *user* message and name is default ---
      isFirstUserMessage = currentChat.name === 'New Chat' && messages.filter(m => m.role === 'user').length === 0;

      updateCurrentChat(chat => ({
        ...chat,
        messages: newMessages,
        // --- Set name if it's the first message ---
        name: isFirstUserMessage ? userInput.substring(0, 30) + (userInput.length > 30 ? '...' : '') : chat.name,
      }));
      historyToSubmit = newMessages;
    }

    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      await callGeminiAPI(historyToSubmit, currentChat.systemPrompt, abortControllerRef.current.signal);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('API call failed:', err);
        setError('Sorry, something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setInput(message.text);
    document.getElementById('chat-input')?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setInput('');
  };

  const handleRegenerate = async () => {
    if (isLoading || !currentChat) return;

    const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === 'user');
    if (lastUserMessageIndex === -1) return;

    const historyToRegenerate = messages.slice(0, lastUserMessageIndex + 1);

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    updateCurrentChat(chat => ({ ...chat, messages: historyToRegenerate }));

    try {
      await callGeminiAPI(historyToRegenerate, currentChat.systemPrompt, abortControllerRef.current.signal);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('API call failed:', err);
        setError('Sorry, something went wrong. Please try again.');
        updateCurrentChat(chat => ({ ...chat, messages: messages }));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * Calls the Gemini API
   */
  const callGeminiAPI = async (chatHistory, systemPrompt, signal) => {
     // Ensure chatHistory is an array
     if (!Array.isArray(chatHistory)) {
        console.error("Invalid chatHistory provided to callGeminiAPI:", chatHistory);
        setError("Internal error: Invalid chat history.");
        setIsLoading(false);
        return;
      }

    const apiKey = 'AIzaSyDimDCqEDO7O-1j_WnzKeAa0VKWyM1Fw0M'; // Use your actual key

    if (apiKey === 'YOUR_API_KEY_HERE') {
      setError('Please add your API key');
      setIsLoading(false);
      return;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const userAndModelHistory = chatHistory.filter(
      msg => msg.role === 'user' || msg.role === 'model'
    );

    const payload = {
      contents: userAndModelHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user', // Ensure correct role mapping
        parts: [{ text: msg.text }],
      })),
    };

    if (systemPrompt && systemPrompt.trim().length > 0) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    try {
        const data = await fetchWithBackoff(apiUrl, options, signal);
        const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (modelResponse) {
          const newModelMessage = { id: crypto.randomUUID(), role: 'model', text: modelResponse };
          updateCurrentChat(chat => ({ ...chat, messages: [...chat.messages, newModelMessage] }));
        } else {
            // Check for safety ratings or other reasons for no content
            const safetyReason = data.candidates?.[0]?.finishReason;
            const safetyRatings = data.candidates?.[0]?.safetyRatings;
             if (safetyReason === 'SAFETY') {
                 console.warn('API Response blocked due to safety settings:', safetyRatings);
                 setError(`Response blocked due to safety settings. (${safetyRatings?.map(r => r.category).join(', ')})`);
                 // Add a message indicating blockage
                 const blockedMessage = { id: crypto.randomUUID(), role: 'model', text: `*Response blocked due to safety settings.*` };
                 updateCurrentChat(chat => ({ ...chat, messages: [...chat.messages, blockedMessage] }));

             } else {
                console.error("No valid response or safety block:", data);
                throw new Error('No valid response from API.');
             }
        }
    } catch (error) {
         if (error.name !== 'AbortError') {
             console.error("Error during API call:", error);
             setError(`API Error: ${error.message}`);
         } else {
             console.log("API call aborted."); // Don't set error state if aborted
         }
         // Re-throw non-abort errors so handleSubmit can catch them if needed
         if (error.name !== 'AbortError') {
             throw error;
         }
    }

  };

  const handleSaveSettings = (newName, newSystemPrompt) => {
    updateCurrentChat(chat => ({
      ...chat,
      name: newName.trim() || 'Chat', // Ensure name isn't empty
      systemPrompt: newSystemPrompt
    }));
    setIsSettingsModalOpen(false);
  };

  // --- NEW: Delete Chat Handler ---
  const handleDeleteChat = (chatIdToDelete) => {
    // Basic confirmation (replace with modal later if needed)
    // if (!window.confirm("Are you sure you want to delete this chat?")) {
    //   return;
    // }

    setChats(prevChats => {
      const remainingChats = prevChats.filter(chat => chat.id !== chatIdToDelete);
      // If we deleted the current chat, select another one
      if (currentChatId === chatIdToDelete) {
        if (remainingChats.length > 0) {
            // Sort remaining chats to select the "next" one consistently
            const sortedRemaining = [...remainingChats].sort((a, b) => {
               if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
               return b.createdAt - a.createdAt;
            });
          setCurrentChatId(sortedRemaining[0].id);
        } else {
          // No chats left, create a new one
          const newChat = createNewChat();
          setCurrentChatId(newChat.id);
          return [newChat]; // Return the new chat array
        }
      }
      return remainingChats;
    });
  };

  // --- NEW: Toggle Pin Handler ---
  const handleTogglePinChat = (chatIdToToggle) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatIdToToggle ? { ...chat, isPinned: !chat.isPinned } : chat
      )
    );
  };

  // --- NEW: Rename Chat Handler (opens settings) ---
  const handleRenameChat = (chatIdToRename) => {
    setCurrentChatId(chatIdToRename); // Switch to the chat first
    setIsSettingsModalOpen(true); // Then open settings for it
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // --- NEW: Share Chat Handler (copies JSON) ---
  const handleShareChat = (chatIdToShare) => {
    const chatToShare = chats.find(chat => chat.id === chatIdToShare);
    if (!chatToShare) return;

    const chatJson = JSON.stringify(chatToShare, null, 2); // Pretty print JSON

    const textArea = document.createElement('textarea');
    textArea.value = chatJson;
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setFeedbackMessage('Chat JSON copied to clipboard!');
      setTimeout(() => setFeedbackMessage(''), 2000); // Clear message after 2s
    } catch (err) {
      console.error('Failed to copy chat: ', err);
      setFeedbackMessage('Failed to copy chat.');
      setTimeout(() => setFeedbackMessage(''), 2000);
    }
    document.body.removeChild(textArea);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const filteredMessages = messages.filter(msg =>
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lastMessage = messages[messages.length - 1];
  
  // --- Sort chats for display in sidebar ---
   const sortedChatsForSidebar = [...chats].sort((a, b) => {
      // Pinned chats first
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // Then by creation date, newest first
      return b.createdAt - a.createdAt;
    });


  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            overflow: hidden; /* Prevent body scroll when sidebar/modal open */
          }
          .code-block {
            border-radius: 0.5rem;
            margin: 0.5rem 0;
            font-size: 0.875rem;
            line-height: 1.25rem;
            overflow-x: auto;
          }
          .code-block-wrapper {
            position: relative;
          }
           /* Subtle scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5); /* gray-400 opacity 50 */
            border-radius: 20px;
            border: 3px solid transparent;
             background-clip: content-box;
          }
          .dark ::-webkit-scrollbar-thumb {
             background-color: rgba(107, 114, 128, 0.5); /* gray-500 opacity 50 */
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: rgba(107, 114, 128, 0.7); /* gray-500 opacity 70 */
          }
           .dark ::-webkit-scrollbar-thumb:hover {
             background-color: rgba(156, 163, 175, 0.7); /* gray-400 opacity 70 */
          }
        `}
      </style>

      {/* --- Feedback Message Display --- */}
      {feedbackMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300">
          {feedbackMessage}
        </div>
      )}

      <div className={`flex h-screen w-full overflow-hidden ${isDarkMode ? 'dark' : ''}`}>

        <Sidebar
          chats={sortedChatsForSidebar} // Use sorted chats
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={handleNewChat}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          // --- NEW: Pass action handlers ---
          onDeleteChat={handleDeleteChat}
          onTogglePinChat={handleTogglePinChat}
          onRenameChat={handleRenameChat}
          onShareChat={handleShareChat}
        />

        {currentChat && ( // Only render modal if a chat exists
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            chat={currentChat}
            onSave={handleSaveSettings}
          />
        )}


        <div
          className={`w-full min-h-screen p-0 sm:p-4 flex justify-center items-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black`}
        >
         {/* Only render chat UI if a chat is selected */}
         {currentChat ? (
          <div className="flex flex-col h-full sm:h-[90vh] max-h-[1000px] w-full max-w-3xl bg-white dark:bg-gray-950 shadow-2xl rounded-none sm:rounded-lg overflow-hidden">
            {/* Header */}
            <header className="p-4 flex flex-col sm:flex-row justify-between items-center text-xl font-bold text-white shadow-md bg-gradient-to-r from-blue-600 to-cyan-500 flex-shrink-0 gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-full hover:bg-white/20 sm:hidden"
                  title="Open Menu"
                >
                  <MenuIcon />
                </button>
                <h1 className="text-xl font-bold text-white truncate">{currentChat.name}</h1>
              </div>

              <div className="flex-grow w-full sm:w-auto sm:max-w-xs">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search chat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 p-2 rounded-lg text-sm text-gray-900 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      title="Clear search"
                    >
                      <ClearSearchIcon />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                  title="Settings"
                >
                  <SettingsIcon />
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                  title="Toggle Theme"
                >
                  {isDarkMode ? <SunIcon /> : <MoonIcon />}
                </button>
              </div>
            </header>

            {/* Message List */}
            <main className="flex-grow p-4 md:p-6 space-y-5 overflow-y-auto">
              {filteredMessages.map((msg) => {
                const isActuallyLastMessage =
                  lastMessage &&
                  lastMessage.id === msg.id;

                return (
                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                    showRegenerate={
                      !isUser(msg) && isActuallyLastMessage && !isLoading
                    }
                    onRegenerate={handleRegenerate}
                    onEdit={handleStartEdit}
                    isEditing={editingMessageId === msg.id}
                    isLoading={isLoading}
                  />
                );
              })}

              {isLoading && <LoadingIndicator />}

              {!isLoading && filteredMessages.length === 0 && searchTerm.length > 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No messages found matching "{searchTerm}"
                </div>
              )}
               {/* Show initial message if no user messages yet and not searching */}
               {!isLoading && messages.filter(m => m.role === 'user').length === 0 && searchTerm.length === 0 && messages.length === 1 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 pt-10">
                    Send a message to start the conversation.
                  </div>
               )}

              {error && (
                <div className="flex justify-center">
                  <div className="p-3 px-5 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 shadow-md">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </main>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0"
            >
              {editingMessageId && (
                <div className="flex justify-between items-center pb-2 px-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Editing message...</span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <input
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={editingMessageId ? "Save your edit..." : "Type your message..."}
                  className="flex-grow p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                />

                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="p-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200"
                    title="Stop Generating"
                  >
                    <StopIcon />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={!input.trim()}
                    title={editingMessageId ? "Save Edit" : "Send Message"}
                  >
                    {editingMessageId ? <CheckIcon size="w-6 h-6" /> : <SendIcon />}
                  </button>
                )}
              </div>
            </form>
          </div>
         ) : (
             // --- Show placeholder if no chats exist ---
             <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>No conversations yet.</p>
                <button
                    onClick={handleNewChat}
                    className="mt-4 p-3 rounded-lg flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                    <NewChatIcon /> Start a New Chat
                </button>
             </div>
         )}
        </div>
      </div>
    </>
  );
}

