import http from 'http';

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/data-plans/sync',
    method: 'POST',
    headers: {
        // Need to bypass adminAuth or make the script just run the function directly.
    }
});
