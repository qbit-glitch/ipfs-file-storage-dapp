const autocannon = require('autocannon');

function runBenchmark() {
  const instance = autocannon({
    url: 'http://localhost:5000/api/transactions',
    connections: 100,
    duration: 60,
    methods: ['GET'],
    headers: {
      'Content-Type': 'application/json'
    }
  }, (err, results) => {
    if (err) {
      console.error('Benchmark Error:', err);
      return;
    }
    console.log('Benchmark Results:');
    console.log('Requests:', results.requests.total);
    console.log('Latency (avg):', results.latency.average);
    console.log('Requests/sec:', results.requests.per1xx);
  });

  autocannon.track(instance);
}

runBenchmark();