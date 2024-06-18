const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let appState = {
  calls: {},
  menu: {
    items: {},
  },
};

app.get('/', (req, res) => {
  console.log("root");
  console.log("root");
  res.json({success: 'OK'});
});

app.get('/menu', (req, res) => {
  console.log("getting info for the menu");
  console.log('XXX Menu: ',appState.menu);
  res.json(Object.values(appState.menu.items));
});

app.post('/menu/items', (req, res) => {
  console.log("adding item to menu");
  console.log(req.body);
  const item = req.body;
  appState.menu.items[item.name] = item;
  res.send("successfully added item to menu");
});

app.delete('/menu/items', (req, res) => {
  console.log("clearing menu");
  appState.menu.items = [];
  res.send("successfully cleared the menu");
});

app.post('/calls', (req, res) => {
  console.log("creating a call");
  const id = uuidv4();
  appState.calls[id] = { 
    id, 
    order: {
      items: [],
    }
  };
  console.log(id);
  res.send(id);
});

app.get('/calls/:id', (req, res) => {
  const id = req.params.id;
  console.log("getting info for a call: ", id);
  const call = appState.calls[id]
  if (call) {
    console.log(call);
    res.json(call);
  } else {
    res.status(404).send('Call not found');
  }
});

app.get('/calls/:id/order', (req, res) => {
  const id = req.params.id;
  console.log("getting info for a call order: ", id);
  const call = appState.calls[id];
  if (call) {
    console.log(call.order);
    res.json(call.order);
  } else {
    res.status(404).send('Call not found');
  }
});

app.post('/calls/:id/order/items', (req, res) => {
  const id = req.params.id;
  const itemRequest = req.body.item;
  console.log("updating order (adding item) to call ", id, itemRequest);
  console.log(req.body);
  console.log('state:', appState.calls)

  if (appState.calls[id]) {
    const call = appState.calls[id];
    const menu = appState.menu;

    if (!menu.items[itemRequest]) {
      console.log('Item not on menu:', menu.items);
      res.send("We were unable to submit this order as there were items requested that were not on the menu.");
    } else {
      const newItem = menu.items[itemRequest];

      if (call.order) {
        call.order.items.push(newItem);
      } else {
        call.order = {
          items: [newItem],
        };
      }

      console.log('Item added to order');
      res.send("We were able to successfully add the item to the order!");
    }
  } else {
    res.send("We were unable to add the item to the order as the specified call id does not exist.");
  }
});

app.delete('/calls/:id/order/items', (req, res) => {
  console.log("updating order (removing item)");
  console.log(req.body);
  const id = req.params.id;
  const itemRequest = req.body.item;

  if (appState.calls[id]) {
    const call = appState.calls[id];

    if (call.order) {
      const index = call.order.items.findIndex(item => item.name === itemRequest);
      if (index !== -1) {
        call.order.items.splice(index, 1);
        res.send("We were able to successfully remove the item from the order!");
      } else {
        res.send("That item was not in the order.");
      }
    } else {
      res.send("No order exists for this call.");
    }
  } else {
    res.send("We were unable to remove the item from the order as the specified call id does not exist.");
  }
});

app.delete('/calls/:id/order', (req, res) => {
  console.log("clearing a call order");
  const id = req.params.id;

  if (appState.calls[id]) {
    const call = appState.calls[id];
    call.order = null;
    res.send("successfully cleared the call's order");
  } else {
    res.status(404).send('Call not found');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
