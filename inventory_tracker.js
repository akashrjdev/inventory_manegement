// server.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/inventoryDB')
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error(err));

// Schema
const itemSchema = new mongoose.Schema({
  name: String,
  category: String,
  quantity: Number,
  price: Number,
  addedDate: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', itemSchema);

// CRUD Routes
app.post('/items', async (req, res) => {
  const item = new Item(req.body);
  await item.save();
  res.json(item);
});

app.get('/items', async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.put('/items/:id', async (req, res) => {
  const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/items/:id', async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ message: "Item deleted" });
});

// Serve HTML directly
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inventory Tracker</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #2c3e50; }
    form { margin-bottom: 20px; }
    input, select { margin: 5px; padding: 8px; }
    button { padding: 8px 12px; margin: 5px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: center; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h1>📦 Inventory Tracker</h1>

  <form id="itemForm">
    <input type="text" id="name" placeholder="Item Name" required>
    <input type="text" id="category" placeholder="Category" required>
    <input type="number" id="quantity" placeholder="Quantity" required>
    <input type="number" id="price" placeholder="Price" required>
    <button type="submit">Add Item</button>
  </form>

  <table>
    <thead>
      <tr>
        <th>Name</th><th>Category</th><th>Quantity</th><th>Price</th><th>Actions</th>
      </tr>
    </thead>
    <tbody id="itemsTable"></tbody>
  </table>

  <script>
    const form = document.getElementById('itemForm');
    const table = document.getElementById('itemsTable');

    async function fetchItems() {
      const res = await fetch('/items');
      const items = await res.json();
      table.innerHTML = '';
      items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = \`
          <td>\${item.name}</td>
          <td>\${item.category}</td>
          <td>\${item.quantity}</td>
          <td>\${item.price}</td>
          <td>
            <button onclick="deleteItem('\${item._id}')">Delete</button>
            <button onclick="updateItem('\${item._id}')">Update</button>
          </td>
        \`;
        table.appendChild(row);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const item = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        quantity: document.getElementById('quantity').value,
        price: document.getElementById('price').value
      };
      await fetch('/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
      form.reset();
      fetchItems();
    });

    async function deleteItem(id) {
      await fetch(\`/items/\${id}\`, { method: 'DELETE' });
      fetchItems();
    }

    async function updateItem(id) {
      const newQuantity = prompt("Enter new quantity:");
      if (newQuantity) {
        await fetch(\`/items/\${id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: newQuantity })
        });
        fetchItems();
      }
    }

    fetchItems();
  </script>
</body>
</html>
  `);
});

// Start server
app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
