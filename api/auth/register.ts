export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      const { email, name, password } = req.body;
      
      // Basic validation
      if (!email || !name || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'name', message: 'Name is required' },
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

      // Password validation
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
          errors: [
            { field: 'password', message: 'Password must be at least 6 characters' }
          ]
        });
      }

      // Mock successful registration (for testing)
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User registered successfully',
        data: {
          user: {
            id: 'mock-user-id-' + Date.now(),
            name: name,
            email: email,
            currency: 'USD',
            isEmailVerified: true,
            onboardingDone: true
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
