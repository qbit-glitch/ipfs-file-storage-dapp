const client = require('prom-client');

class PerformanceMonitor {
  constructor() {
    this.register = new client.Registry();

    // Database query performance metric
    this.dbQueryDuration = new client.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['query_type'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    // HTTP request duration metric
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'code'],
      buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500]
    });

    this.register.registerMetric(this.dbQueryDuration);
    this.register.registerMetric(this.httpRequestDuration);
  }

  // Wrap database queries with performance tracking
  async monitorQuery(queryFn, type) {
    const end = this.dbQueryDuration.startTimer({ query_type: type });
    try {
      return await queryFn();
    } finally {
      end();
    }
  }

  // Middleware for tracking HTTP request duration
  httpRequestMiddleware() {
    return (req, res, next) => {
      const end = this.httpRequestDuration.startTimer();
      res.on('finish', () => {
        end({ 
          method: req.method, 
          route: req.route ? req.route.path : req.path, 
          code: res.statusCode 
        });
      });
      next();
    };
  }

  // Expose metrics endpoint
  async getMetrics() {
    return await this.register.metrics();
  }
}

module.exports = new PerformanceMonitor();