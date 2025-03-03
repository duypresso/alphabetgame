const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a simple egg placeholder
const canvas = createCanvas(100, 120);
const ctx = canvas.getContext('2d');

// Draw egg shape
ctx.fillStyle = '#ffffff';
ctx.strokeStyle = '#000000';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.ellipse(50, 60, 40, 50, 0, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();

// Save files
fs.writeFileSync('assets/egg.png', canvas.toBuffer());

// Create broken version
ctx.beginPath();
ctx.moveTo(30, 40);
ctx.lineTo(70, 80);
ctx.stroke();
fs.writeFileSync('assets/broken_egg.png', canvas.toBuffer());
