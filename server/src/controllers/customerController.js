import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CustomerController {
  static async list(req, res, next) {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { externalId: { contains: search } }
        ];
      }

      const [total, customers] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit, 10),
          orderBy: { createdAt: 'desc' },
          include: {
            orders: {
              include: { product: true },
              orderBy: { purchaseDate: 'desc' }
            },
            _count: {
              select: { tickets: true, orders: true }
            }
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          customers,
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
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id },
        include: {
          orders: {
            include: { product: true },
            orderBy: { purchaseDate: 'desc' }
          },
          tickets: {
            include: { product: true, order: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!customer) {
        return res.status(404).json({ success: false, error: { message: 'Customer not found' } });
      }

      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
}
