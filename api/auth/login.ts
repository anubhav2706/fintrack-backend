export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errors: [
            { field: 'email', message: 'Invalid email format' }
          ]
        });
      }

      // Mock successful login (for testing)
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Login successful',
        data: {
          user: {
            id: 'mock-user-id-' + Date.now(),
            name: 'Mock User',
            email: email,
            currency: 'USD'
          },
          tokens: {
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now()
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: []
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Method not allowed',
      errors: []
    });
  }
}
