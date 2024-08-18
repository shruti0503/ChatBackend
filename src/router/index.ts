import express from 'express';
import { login, register } from '../controllers/authentication';
import { getAllUsers } from '../controllers/users';
import { isAuthenticated } from '../middleware';
import { getConversationDetails } from '../db/users';
import { getUserConversations } from '../controllers/chats';
const router = express.Router();

router.post('/auth/register', register);//dwed
router.post('/auth/login', login); //ko
router.get('/users', getAllUsers);
router.get('/get-conversation',getUserConversations);
router.get('/user-conversations/:userId',getUserConversations)

export default router;
