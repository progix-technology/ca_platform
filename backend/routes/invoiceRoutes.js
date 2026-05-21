import express from 'express';
import { downloadInvoice } from '../controllers/invoiceController.js';

const router = express.Router();

router.get('/download', downloadInvoice);

export default router;