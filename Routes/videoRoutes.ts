import express from 'express';
import { container } from '../config/container';
import { VideoController } from '../controller/video/VideoController';
import { combinedProtect } from '../middleware/authProtect';
import { trainerProtect } from '../middleware/trainerAuth';
import { checkRole } from '../middleware/roleMiddleware';

const router = express.Router();
const videoController = container.get<VideoController>(VideoController);

// Trainer starts the session
router.post('/start', trainerProtect, (req, res) => { 
    videoController.startCall(req, res); 
});

// User/Trainer validates access before joining socket room
router.get('/validate/:sessionId', combinedProtect, (req, res) => { 
    videoController.validateAccess(req, res); 
});

export default router;