import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes         from './routes/authRoutes';
import equipmentRoutes    from './routes/equipmentRoutes';
import orderRoutes        from './routes/orderRoutes';
import adminRoutes        from './routes/adminRoutes';
import messageRoutes      from './routes/messageRoutes';
import reviewRoutes       from './routes/reviewRoutes';
import favouriteRoutes    from './routes/favouriteRoutes';
import notificationRoutes from './routes/notificationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import communityRoutes from './routes/communityRoutes';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth',          authRoutes);
app.use('/api/equipments',    equipmentRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/favourites',    favouriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/community', communityRoutes);

app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', message: 'EquipShare API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
