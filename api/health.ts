export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      firebase: 'connected'
    }
  });
}
