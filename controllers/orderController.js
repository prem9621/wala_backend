const db = require('../config/db');

const allowedStatuses = [
  'pending',
  'accepted',
  'in_billing',
  'completed',
  'cancelled',
];

const createOrder = async (req, res) => {
  try {
    const {
      table_id,
      items,
      customer_name = '',
      customer_phone = '',
      customer_note = '',
    } = req.body;

    if (!table_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data',
      });
    }

    const cleanedItems = items
      .map((item) => ({
        item_name: String(item.item_name || item.name || '').trim(),
        qty: Number(item.qty),
        price: Number(item.price),
      }))
      .filter(
        (item) =>
          item.item_name.length > 0 &&
          Number.isFinite(item.qty) &&
          item.qty > 0 &&
          Number.isFinite(item.price) &&
          item.price >= 0
      );

    if (cleanedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid items found in order',
      });
    }

    const orderCode = `ORD${Date.now()}`;
    const totalAmount = cleanedItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    const safeCustomerName = String(customer_name || '').trim();
    const safeCustomerPhone = String(customer_phone || '').trim();
    const safeCustomerNote = String(customer_note || '').trim();

    const orderSql = `
      INSERT INTO customer_orders
      (
        table_id,
        order_code,
        status,
        source,
        imported_to_pos,
        total_amount,
        customer_name,
        customer_phone,
        customer_note
      )
      VALUES (?, ?, 'pending', 'qr', 0, ?, ?, ?, ?)
    `;

    const [orderResult] = await db.query(orderSql, [
      String(table_id),
      orderCode,
      totalAmount,
      safeCustomerName,
      safeCustomerPhone,
      safeCustomerNote,
    ]);

    const orderId = orderResult.insertId;

    const itemValues = cleanedItems.map((item) => [
      orderId,
      item.item_name,
      item.qty,
      item.price,
      item.qty * item.price,
    ]);

    const itemSql = `
      INSERT INTO customer_order_items
      (order_id, item_name, qty, price, line_total)
      VALUES ?
    `;

    await db.query(itemSql, [itemValues]);

    return res.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order_id: orderId,
        order_code: orderCode,
        table_id: String(table_id),
        total_amount: totalAmount,
        customer_name: safeCustomerName,
        customer_phone: safeCustomerPhone,
        customer_note: safeCustomerNote,
      },
    });
  } catch (err) {
    console.log('Create order error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to create order: ${err.message}`,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, pending_only, not_imported } = req.query;

    let sql = `
      SELECT *
      FROM customer_orders
      WHERE 1 = 1
    `;

    const params = [];

    if (status && allowedStatuses.includes(status)) {
      sql += ` AND status = ? `;
      params.push(status);
    }

    if (pending_only === 'true') {
      sql += ` AND status = 'pending' `;
    }

    if (not_imported === 'true') {
      sql += ` AND imported_to_pos = 0 `;
    }

    sql += ` ORDER BY created_at DESC `;

    const [orders] = await db.query(sql, params);

    if (!orders.length) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const ids = orders.map((o) => o.id);

    const itemSql = `
      SELECT *
      FROM customer_order_items
      WHERE order_id IN (?)
      ORDER BY id ASC
    `;

    const [items] = await db.query(itemSql, [ids]);

    const itemMap = {};

    items.forEach((item) => {
      if (!itemMap[item.order_id]) {
        itemMap[item.order_id] = [];
      }
      itemMap[item.order_id].push(item);
    });

    const finalData = orders.map((order) => ({
      ...order,
      items: itemMap[order.id] || [],
    }));

    return res.json({
      success: true,
      data: finalData,
    });
  } catch (err) {
    console.log('Get orders error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch orders: ${err.message}`,
    });
  }
};

const getPendingOrders = async (req, res) => {
  try {
    const sql = `
      SELECT *
      FROM customer_orders
      WHERE status = 'pending' AND imported_to_pos = 0
      ORDER BY created_at DESC
    `;

    const [orders] = await db.query(sql);

    if (!orders.length) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const ids = orders.map((o) => o.id);

    const itemSql = `
      SELECT *
      FROM customer_order_items
      WHERE order_id IN (?)
      ORDER BY id ASC
    `;

    const [items] = await db.query(itemSql, [ids]);

    const itemMap = {};

    items.forEach((item) => {
      if (!itemMap[item.order_id]) {
        itemMap[item.order_id] = [];
      }
      itemMap[item.order_id].push(item);
    });

    const finalData = orders.map((order) => ({
      ...order,
      items: itemMap[order.id] || [],
    }));

    return res.json({
      success: true,
      data: finalData,
    });
  } catch (err) {
    console.log('Get pending orders error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch pending orders: ${err.message}`,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const sql = `
      UPDATE customer_orders
      SET status = ?
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Order status updated',
    });
  } catch (err) {
    console.log('Update order status error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to update order status: ${err.message}`,
    });
  }
};

const markOrderImported = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE customer_orders
      SET imported_to_pos = 1, status = 'in_billing'
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Order imported to POS',
    });
  } catch (err) {
    console.log('Mark order imported error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to mark order as imported: ${err.message}`,
    });
  }
};

const getMenu = async (req, res) => {
  try {
    const sql = `
      SELECT id, name, price, category
      FROM menu_items
      WHERE is_available = 1
      ORDER BY category ASC, name ASC
    `;

    const [results] = await db.query(sql);

    return res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.log('Get menu error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch menu: ${err.message}`,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getPendingOrders,
  updateOrderStatus,
  markOrderImported,
  getMenu,
};