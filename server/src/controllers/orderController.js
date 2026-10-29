import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderController {
  static async list(req, res, next) {
    try {
      const { search = '', status = '', page = 1, limit = 20 } = req.query;
      const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

      const where = {};
      if (status) {
        where.orderStatus = status;
      }
      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { trackingNumber: { contains: search } },
          { carrier: { contains: search } },
          { customer: { name: { contains: search } } }
        ];
      }

      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          skip,
          take: parseInt(limit, 10),
          orderBy: { purchaseDate: 'desc' },
          include: {
            customer: true,
            product: true,
            tickets: true
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          orders,
          total,
          page: parseInt(page, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          customer: true,
          product: true,
          tickets: true
        }
      });

      if (!order) {
        return res.status(404).json({ success: false, error: { message: 'Order not found' } });
      }

      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}
