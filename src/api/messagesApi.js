/**
 * Messages/Messaging API
 * Handles conversations and messages
 */

import { API_CONFIG } from '@/config/environment';

const API_BASE = `${API_CONFIG.baseURL}/messages`;

export const messagesApi = {
  /**
   * Get all conversations for current user
   * @returns {Promise<Array>} - List of conversations
   */
  getConversations: async () => {
    const response = await fetch(`${API_BASE}/conversations`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    
    return response.json();
  },

  /**
   * Get messages in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Query options (page, limit)
   * @returns {Promise<Object>} - Messages with pagination
   */
  getMessages: async (conversationId, options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value);
    });

    const url = `${API_BASE}/conversations/${conversationId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    return response.json();
  },

  /**
   * Send a message
   * @param {string} recipientId - Recipient user ID
   * @param {string} content - Message content
   * @returns {Promise<Object>} - Sent message
   */
  sendMessage: async (recipientId, content) => {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, content }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }
    
    return response.json();
  },

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} - Updated message
   */
  markAsRead: async (messageId) => {
    const response = await fetch(`${API_BASE}/${messageId}/read`, {
      method: 'PATCH',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark message as read');
    }
    
    return response.json();
  }
};

export default messagesApi;
