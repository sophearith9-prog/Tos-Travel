// A stylized interpretation of the user's stone-face mountain reference.
export function drawKlaKonMountain(ctx) {
  ctx.save();
  ctx.translate(605, 185);
  ctx.fillStyle = '#84926b';
  ctx.beginPath(); ctx.moveTo(-91, 0); ctx.lineTo(-84, -43);
  ctx.lineTo(-73, -104); ctx.lineTo(-46, -139); ctx.lineTo(-10, -145);
  ctx.lineTo(21, -116); ctx.lineTo(52, -89); ctx.lineTo(74, -38);
  ctx.lineTo(88, 0); ctx.closePath(); ctx.fill();
  // Weathered rock ledges and deep seams around the carving.
  for (const [x, y, w, h] of [[-77,-94,22,48],[-68,-130,18,35],[-54,-61,24,61],[-22,-49,32,49],[12,-44,32,44],[39,-31,26,31]]) {
    ctx.fillStyle = '#64765b'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#99a47b'; ctx.fillRect(x, y, w - 3, 3);
    ctx.strokeStyle = '#53664f'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  }
  // Arched headdress, elongated ear, and the calm face carved into the cliff.
  ctx.fillStyle = '#53674c';
  ctx.beginPath(); ctx.ellipse(-15, -93, 37, 53, -0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aab282';
  ctx.beginPath(); ctx.ellipse(-12, -87, 30, 44, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c0c390'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(-15, -103, 32, 36, 0, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#738257'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(-15, -103, 27, 31, 0, Math.PI, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + i * Math.PI / 8;
    ctx.fillStyle = '#89976a'; ctx.beginPath();
    ctx.arc(-15 + Math.cos(a) * 32, -103 + Math.sin(a) * 36, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#c0c390'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(-42, -87, 7, 22, -0.12, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#5d7050'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-29, -105); ctx.quadraticCurveTo(-16, -109, -7, -98);
  ctx.moveTo(-29, -98); ctx.quadraticCurveTo(-19, -92, -10, -96);
  ctx.moveTo(1, -100); ctx.quadraticCurveTo(9, -103, 13, -96); ctx.stroke();
  ctx.fillStyle = '#b9bf8e';
  ctx.beginPath(); ctx.moveTo(-4, -101); ctx.lineTo(10, -81);
  ctx.quadraticCurveTo(4, -72, -8, -79); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#64764f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-7, -79); ctx.quadraticCurveTo(3, -73, 10, -81);
  ctx.moveTo(-17, -69); ctx.quadraticCurveTo(-3, -59, 12, -69); ctx.stroke();
  ctx.strokeStyle = '#ced0a0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-13, -65); ctx.quadraticCurveTo(-1, -59, 9, -65); ctx.stroke();
  ctx.fillStyle = '#9ca77a'; ctx.fillRect(-36, -44, 64, 11);
  for (let x = -30; x < 25; x += 10) {
    ctx.strokeStyle = '#64764f'; ctx.beginPath(); ctx.ellipse(x, -39, 3, 4, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Foliage frames the face without covering the eyes and smile.
  for (const [x, y, r] of [[-73,-128,17],[-47,-148,15],[-12,-153,13],[28,-125,17],[46,-97,16],[60,-63,18],[71,-17,24],[-76,-22,20]]) {
    ctx.fillStyle = '#56764f'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#73905b'; ctx.beginPath(); ctx.arc(x - 4, y - 4, r * 0.58, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
