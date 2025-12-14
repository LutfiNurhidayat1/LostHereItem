import { useState } from 'react';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { ChatBubble } from './ui/ChatBubble';

interface ChatScreenProps {
  userName?: string;
  itemType?: string;
  reportType: 'lost' | 'found';
  onBack: () => void;
}

interface Message {
  id: string;
  text: string;
  image?: string;
  sender: 'user' | 'other';
  timestamp: string;
}

export function ChatScreen({ userName = 'User', itemType = 'Item', reportType, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hai! Saya rasa saya menemukan barang Anda. Bisakah Anda jelaskan lebih detail?',
      sender: 'other',
      timestamp: '10:30'
    },
    {
      id: '2',
      text: 'Ya! Ini adalah ransel biru dengan robek kecil di tali kiri dan ada gantungan kunci.',
      sender: 'user',
      timestamp: '10:32'
    },
    {
      id: '3',
      text: 'Cocok! Saya menemukannya dekat perpustakaan. Bisa Anda ceritakan seperti apa gantungan kuncinya?',
      sender: 'other',
      timestamp: '10:33'
    }
  ]);

  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: '',
          image: reader.result as string,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        };
        setMessages([...messages, newMessage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const isLost = reportType === 'lost';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-gray-900">{userName}</h2>
            <p className="text-gray-500 text-sm">{itemType}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <p className="text-blue-700 text-sm text-center">
            🔒 Chat ini bersifat pribadi dan aman. Verifikasi barang sebelum membagikan info kontak pribadi.
          </p>
        </div>

        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            text={message.text}
            image={message.image}
            sender={message.sender}
            timestamp={message.timestamp}
          />
        ))}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <label className="flex-shrink-0">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </div>
          </label>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ketik pesan..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}