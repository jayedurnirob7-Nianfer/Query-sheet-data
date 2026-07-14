fetch('http://localhost:3000/api/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scriptUrl: "https://script.google.com/macros/s/AKfycbwZ9dWtU3mjCPh2xR3-oksFarjQSkc0yIvBvg0H_tVEnndrKG_mgIbmbrYOghpfGjqV/exec" })
}).then(res => res.json()).then(console.log).catch(console.error);
