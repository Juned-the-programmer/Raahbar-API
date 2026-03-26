import { FastifyRequest, FastifyReply } from 'fastify';
import { getDashboardStats as fetchStats } from '../services/dashboardService';

/**
 * Get aggregated dashboard statistics for admins
 */
export async function getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const stats = await fetchStats();
    
    return reply.send({
      success: true,
      data: stats
    });
  } catch (error: any) {
    request.log.error(error, 'Error fetching dashboard stats');
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
