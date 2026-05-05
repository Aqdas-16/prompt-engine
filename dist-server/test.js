import http from 'http';
const req = http.request({
    port: 3000,
    method: "POST",
    path: "/api/generate",
    headers: {
        "x-forwarded-for": "1.2.3.4",
        "forwarded": "1.2.3.4",
        "content-type": "application/json",
        "authorization": "Bearer whatever"
    }
}, (res) => {
    let data = '';
    res.on("data", d => data += d);
    res.on("end", () => console.log('Response:', data));
});
req.end('{"user_input": "hello"}');
