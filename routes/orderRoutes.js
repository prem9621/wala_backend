const express = require('express');
const router = express.Router();

const {
  createOrder,
  getOrders,
  getPendingOrders,
  updateOrderStatus,
  markOrderImported,
  getMenu,
} = require('../controllers/orderController');

router.get('/menu', getMenu);
router.post('/create', createOrder);
router.get('/', getOrders);
router.get('/pending', getPendingOrders);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/imported', markOrderImported);

module.exports = router;