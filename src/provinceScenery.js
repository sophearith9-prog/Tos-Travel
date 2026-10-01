export function prepareProvinceTerrain(scene, province) {
  const key = `province-terrain-${province.id}`;
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get('tiles').getSourceImage();
  const texture = scene.textures.createCanvas(key, source.width, source.height);
  const ctx = texture.context;
  ctx.imageSmoothingEnabled = false;ctx.drawImage(source,0,0);
  const beach = ['island-coast','turquoise-coast'].includes(province.theme);
  const stone = ['palace-night','cliff-temple','brick-temple','angkor','forest-temple'].includes(province.theme);
  for (const id of [1,2,3,21,22,23]) {
    const x = (id-1)%20*18, y = Math.floor((id-1)/20)*18;
    ctx.save();ctx.beginPath();ctx.rect(x,y,18,18);ctx.clip();
    ctx.fillStyle=beach?'#c8a776':stone?'#8f805f':'#947044';ctx.fillRect(x,y,18,18);
    ctx.fillStyle=beach?'#e9d9ae':stone?'#b6a77e':'#b58a56';
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.fillRect(x+col*7-row%2*3,y+row*6+1,5,4);
    if(id<=3){ctx.fillStyle=beach?'#fff0c9':stone?'#d3c18d':province.land;ctx.fillRect(x,y,18,3);
      ctx.fillStyle=beach?'#e6ce97':stone?'#8d9265':'#51764b';for(let n=0;n<6;n++)ctx.fillRect(x+n*3,y+3,2,2);}
    ctx.restore();
  }
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;
}

// Native pixel scenery shares the game's blocky drawing style and province palette.
export function addProvinceScenery(scene, province) {
  const key = `province-${province.id}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 400, 225);
    const ctx = texture.context;
    ctx.imageSmoothingEnabled = false;
    const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const polygon = (points, color) => {
      ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
    };
    const night = province.theme === 'palace-night';
    rect(0, 0, 400, 225, province.sky);
    rect(0, 75, 400, 70, night ? '#354866' : '#e5d6ac');
    rect(0, 125, 400, 100, province.land);
    rect(night ? 330 : 304, 43, 22, 22, night ? '#fff1c5' : '#ffe5a2');
    for (let i = 0; i < 6; i++) {
      const x = (i * 83 + 21) % 400, y = 39 + i % 3 * 15;
      rect(x, y, 34, 4, night ? '#718090' : '#f4e9c9'); rect(x + 7, y - 3, 20, 3, night ? '#718090' : '#f4e9c9');
    }
    if (night) for (let i = 0; i < 32; i++) rect((i * 47) % 400, 12 + i * 13 % 61, 1, 1, '#ffeec3');
    const hill = (x, y, width, height, color) => {
      for (let row = 0; row < height; row += 3) {
        const span = width * (0.22 + 0.78 * row / height);
        rect(x - span / 2, y - height + row, span, 3, color);
      }
    };
    for (let i = 0; i < 7; i++) hill(i * 70, 146, 120, 35 + i % 3 * 12, night ? '#385357' : '#9cac88');
    const tree = (x, y, size = 32, pine = false) => {
      rect(x - 2, y - size, 4, size, '#654d35');
      if (pine) {
        for (let tier = 0; tier < 4; tier++) {
          const w = size * (0.35 + tier * 0.17);
          polygon([[x,y-size-10+tier*7],[x-w/2,y-size+8+tier*7],[x+w/2,y-size+8+tier*7]], '#355b45');
          rect(x-w/3,y-size+6+tier*7,w*0.6,2,'#678a53');
        }
      } else {
        rect(x - size / 2, y - size - 13, size, 15, '#3c6547');
        rect(x - size / 3, y - size - 19, size * 0.65, 9, '#548056');
        rect(x - size / 2 + 3, y - size - 10, size * 0.35, 4, '#88a860');
      }
    };
    const palm = (x, y, height = 48) => {
      rect(x-2,y-height,4,height,'#655239');
      for (let i = 0; i < 6; i++) rect(x-2,y-height+i*8,4,2,'#a88650');
      for (const [dx,dy] of [[-22,0],[-17,-11],[-8,-17],[10,-15],[22,-5],[18,8]]) {
        polygon([[x,y-height],[x+dx,y-height+dy],[x+dx*0.8,y-height+dy+6]],'#365d3e');
        rect(x+dx*0.7,y-height+dy,6,2,'#86a15c');
      }
    };
    const water = (y = 153, height = 48) => {
      rect(0,y,400,height,province.water);
      for (let i = 0; i < 34; i++) rect(i*37%400,y+5+i*11%height,10+i%4*7,1,night?'#e5b769':'#acd4c6');
    };
    const house = (x, y, color = '#9b6a3d') => {
      rect(x+4,y-10,3,10,'#5f4931');rect(x+29,y-10,3,10,'#5f4931');
      rect(x,y-31,38,22,color);rect(x+16,y-23,8,14,'#423b2e');
      for(let row=0;row<4;row++)rect(x,y-29+row*5,38,1,'#c39a5b');
      polygon([[x-4,y-31],[x+19,y-46],[x+42,y-31]],'#774d3b');
      rect(x+3,y-33,33,2,'#d0a264');
    };
    const temple = (x, y, brick = false, angkor = false) => {
      const stone = brick ? '#ae6c46' : '#b9995d';
      rect(x-48,y-22,96,22,stone);
      for(let i=0;i<8;i++)rect(x-44+i*12,y-16,5,15,'#57493b');
      for(const [dx,h] of angkor?[[-34,40],[-18,56],[0,76],[18,56],[34,40]]:[[-29,36],[0,62],[29,36]]) {
        for(let row=0;row<h;row+=5) {
          const width=8+row/h*16;
          rect(x+dx-width/2,y-22-h+row,width,5,stone);
          rect(x+dx-width/2,y-22-h+row,width,1,'#e0bb7a');
        }
      }
      rect(x-7,y-21,14,21,'#3c3930');rect(x-53,y,106,4,'#695239');
    };
    const bridge = (y = 179) => {
      rect(20,y,360,5,'#b89863');rect(20,y-9,360,2,'#ead09b');
      for(let x=22;x<380;x+=18){rect(x,y-9,2,21,'#746044');rect(x,y,9,1,'#e3c595');}
    };
    const waterfall = (x, y, height = 72) => {
      rect(x-20,y-height,46,height,'#667965');rect(x-5,y-height,18,height,'#b5dfd2');
      rect(x,y-height+2,7,height-3,'#edf3d7');
      for(let i=0;i<6;i++)rect(x-13+i*6,y-2-i%2*3,10,3,'#d5eed8');
    };
    const theme = province.theme;
    // Lift landmarks above the playable ground so rivers and bridges stay visible.
    ctx.translate(0,-35);
    if (['island-coast','turquoise-coast','misty-coast'].includes(theme)) {
      water(136,89);hill(125,157,130,35,province.land);hill(330,155,90,28,'#719582');
      rect(0,201,400,24,theme==='turquoise-coast'?'#fff0ca':'#e8d3a3');
      [30,71,355].forEach(x=>palm(x,208,55));
      if(theme==='misty-coast'){hill(60,154,180,93,'#789786');rect(0,105,170,5,'#d5d8bd');rect(15,116,140,3,'#d5d8bd');}
    } else if (['mountain-falls','highland-falls','mangrove-falls','crater-lake','hill-pagoda','pine-forest'].includes(theme)) {
      hill(105,182,230,105,'#65836a');hill(305,187,240,88,'#4b6b56');water(178,47);
      if(theme==='crater-lake'){rect(45,167,310,30,'#398b98');rect(60,169,280,3,'#9fd4be');}
      else waterfall(205,185,theme==='highland-falls'?85:62);
      [18,55,91,290,337,378].forEach(x=>tree(x,210,35+x%23,theme==='pine-forest'||theme==='highland-falls'));
      if(theme==='mangrove-falls')for(let x=20;x<400;x+=50){tree(x,219,40);polygon([[x-2,207],[x-10,225],[x+8,225],[x+2,207]],'#6b6046');}
      if(theme==='hill-pagoda')temple(100,165,false,false);
    } else if (['angkor','temple-lake','forest-temple','cliff-temple','rice-temple','brick-temple'].includes(theme)) {
      if(theme==='cliff-temple'){hill(165,181,250,96,'#70866a');rect(62,164,210,24,'#626b54');temple(165,161);}
      else {water(174,51);temple(205,173,theme==='brick-temple',theme==='angkor');}
      [30,365].forEach(x=>tree(x,211,68));
      [72,325].forEach(x=>palm(x,208));
      if(theme==='temple-lake')for(let i=0;i<4;i++){rect(65+i*14,185,2,10,'#ddd7b4');rect(65+i*14,183,7,2,'#eee5c9');}
      if(theme==='rice-temple')for(let i=0;i<6;i++)rect(0,192+i*5,140,2,'#cfcb82');
    } else if (theme==='palace-night') {
      water(176,49);
      for(let i=0;i<4;i++){const x=100+i*47;rect(x,142,47,33,'#e3c58c');polygon([[x-6,142],[x+23,111-i%2*15],[x+53,142]],'#c89c52');rect(x+21,101-i%2*15,3,25,'#f5d58a');for(let n=0;n<4;n++)rect(x+6+n*10,153,4,20,'#735547');}
      hill(42,176,85,40,'#4c7855');temple(43,149);bridge(210);
      for(let x=10;x<400;x+=28){rect(x,169,2,12,'#735b40');rect(x-2,165,6,5,'#ffe2a1');}
    } else if (theme==='bat-caves') {
      hill(145,194,220,99,'#766d57');rect(126,141,35,19,'#373d34');temple(145,105);
      for(let i=0;i<30;i++){const x=151+i*7,y=124-Math.floor(i/4)*6;polygon([[x-3,y-2],[x,y],[x+3,y-2],[x+1,y+2],[x-1,y+2]],'#3b4340');}
      rect(0,196,400,29,'#92a068');[22,350].forEach(x=>palm(x,210));
    } else if (theme==='rubber') {
      rect(0,164,400,61,'#8dab73');
      for(let row=0;row<3;row++)for(let i=0;i<9;i++)tree(i*50+row*9,160+row*26,25+row*8);
      rect(174,161,32,64,'#b79d72');
    } else if (['border-fields','lotus-fields'].includes(theme)) {
      water(166,40);for(let row=0;row<7;row++)rect(0,191+row*5,400,2,'#c9ce8c');
      if(theme==='border-fields'){rect(238,155,126,28,'#c5b997');rect(256,134,35,22,'#e8d4a4');rect(312,139,28,18,'#dec698');rect(255,161,66,22,'#6b766b');rect(283,183,8,42,'#d7c394');}
      else {hill(330,155,105,55,'#8b9b6a');for(let i=0;i<12;i++){const x=20+i*29;rect(x,175+i%3*5,6,2,'#47795b');rect(x+2,172+i%3*5,2,3,'#eaa3b0');}}
      house(43,182);palm(27,199);
    } else {
      water(148,77);
      if(theme==='bamboo-bridge')bridge(181);
      else if(theme==='dolphin-river') {
        for(const [x,y] of [[145,173],[263,194]])polygon([[x-11,y+2],[x-4,y-5],[x+3,y-8],[x+9,y-4],[x+17,y],[x+5,y],[x-3,y+5]],'#64817e');
      } else if(theme==='river-islands')for(let i=0;i<4;i++){hill(i*106+37,188+i%2*10,70,18,province.land);tree(i*106+37,183+i%2*10,20);}
      if(['river-village','floating-village','angkor'].includes(theme))for(let i=0;i<5;i++)house(15+i*74,197-i%2*6);
      [21,371].forEach(x=>palm(x,211));
    }
    texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const zoom = scene.cameras.main.zoom;
  scene.add.image(400,225,key).setDisplaySize(800/zoom,450/zoom).setScrollFactor(0).setDepth(-20);
  const caption = scene.screenText(400,128,`${province.khmer} · ${province.places}`,{
    fontFamily:'Noto Sans Khmer, Khmer OS Battambang, Arial, sans-serif',fontSize:'12px',color:'#fff2cd',
    stroke:'#17271f',strokeThickness:3,align:'center'
  }).setOrigin(0.5).setDepth(200);
  scene.tweens.add({targets:caption,alpha:0,delay:2500,duration:600});
}
