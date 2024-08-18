import express from 'express';
import { getConversationDetails } from '../db/users';

export const getUserConversations=async(req: express.Request, res: express.Response)=>{
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
    
  try {
    const conversationDetails = await getConversationDetails(userId);
    res.json(conversationDetails);
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }


}