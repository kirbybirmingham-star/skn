/**
 * Messages/Messaging API Endpoints
 * Handles conversations and messages
 */

import express from 'express';
import { supabase } from './supabaseClient.js';
import { authenticateUser } from './middleware.js';

const router = express.Router();

// Middleware - Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/messages/conversations
 * Get all conversations for the current user
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1: participant_1_id (
          id,
          email,
          user_metadata
        ),
        participant_2: participant_2_id (
          id,
          email,
          user_metadata
        ),
        last_message: last_message_id (
          content,
          sender_id,
          created_at
        )
      `)
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/messages/conversations/:conversationId
 * Get messages in a specific conversation
 */
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.participant_1_id !== userId && conversation.participant_2_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const offset = (page - 1) * limit;
    const { data: messages, error: msgError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (msgError) {
      throw msgError;
    }

    res.json({
      messages: messages.reverse(), // Reverse to show chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/messages
 * Send a message
 */
router.post('/', async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient ID and content are required' });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Find or create conversation
    let { data: conversation, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_1_id.eq.${senderId},participant_2_id.eq.${recipientId}),and(participant_1_id.eq.${recipientId},participant_2_id.eq.${senderId})`
      )
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: senderId,
          participant_2_id: recipientId
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      conversation = newConv;
    }

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: senderId,
        recipient_id: recipientId,
        content
      })
      .select()
      .single();

    if (msgError) {
      throw msgError;
    }

    // Update conversation's last message
    await supabase
      .from('conversations')
      .update({
        last_message_id: message.id,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/messages/:messageId/read
 * Mark message as read
 */
router.patch('/:messageId/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    // Verify user is the recipient
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('recipient_id')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json(updated);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
