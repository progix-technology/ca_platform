import userRoutes from './routes/userRoutes.js';
console.log(JSON.stringify(userRoutes.stack.filter(layer=>layer.route).map(layer=>({path:layer.route.path,methods:layer.route.methods})),null,2));
