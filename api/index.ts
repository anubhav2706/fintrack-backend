export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'FinTrack Backend API is running!',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
